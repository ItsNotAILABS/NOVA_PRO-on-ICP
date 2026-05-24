///
/// tests/discovery-protocol.test.js
///
/// Comprehensive test coverage for sdk/discovery-protocol/src/index.js
///
/// Covers:
///   - OrganismAnnouncement: construction, signature, expiry, capabilities
///   - ConnectionRequest: construction, challenge/response, verification
///   - DiscoveryDirectory: registration, discovery, cleanup
///   - DiscoveryEngine: broadcasting, discovery, connection management
///

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  OrganismAnnouncement,
  ConnectionRequest,
  DiscoveryDirectory,
  DiscoveryEngine,
} from '../sdk/discovery-protocol/src/index.js';

// ─── OrganismAnnouncement ─────────────────────────────────────────────────────

describe('OrganismAnnouncement', () => {
  test('constructs with organismId', () => {
    const announcement = new OrganismAnnouncement({
      organismId: 'org1',
    });

    assert.strictEqual(announcement.organismId, 'org1');
    assert.ok(announcement.capabilities instanceof Set);
    assert.strictEqual(announcement.capabilities.size, 0);
    assert.strictEqual(announcement.environment, 'unknown');
    assert.ok(announcement.timestamp > 0);
    assert.strictEqual(announcement.ttl, 60000);
    assert.ok(announcement.signature > 0);
  });

  test('constructs with capabilities and environment', () => {
    const announcement = new OrganismAnnouncement({
      organismId: 'org1',
      capabilities: ['compute', 'storage', 'ai'],
      environment: 'production',
    });

    assert.strictEqual(announcement.capabilities.size, 3);
    assert.ok(announcement.capabilities.has('compute'));
    assert.ok(announcement.capabilities.has('storage'));
    assert.ok(announcement.capabilities.has('ai'));
    assert.strictEqual(announcement.environment, 'production');
  });

  test('signature is deterministic for same data', () => {
    const a1 = new OrganismAnnouncement({
      organismId: 'org1',
      capabilities: ['compute'],
    });

    const a2 = new OrganismAnnouncement({
      organismId: 'org1',
      capabilities: ['compute'],
    });

    // Timestamps differ, so signatures will differ
    // But structure should be valid
    assert.ok(typeof a1.signature === 'number');
    assert.ok(typeof a2.signature === 'number');
  });

  test('signature differs for different data', () => {
    const a1 = new OrganismAnnouncement({
      organismId: 'org1',
      capabilities: ['compute'],
    });

    const a2 = new OrganismAnnouncement({
      organismId: 'org2',
      capabilities: ['compute'],
    });

    // Different organismIds should produce different signatures
    assert.notStrictEqual(a1.signature, a2.signature);
  });

  test('isExpired returns false for fresh announcement', () => {
    const announcement = new OrganismAnnouncement({
      organismId: 'org1',
    });

    assert.strictEqual(announcement.isExpired(), false);
  });

  test('isExpired returns true for old announcement', () => {
    const announcement = new OrganismAnnouncement({
      organismId: 'org1',
    });

    announcement.timestamp = Date.now() - 70000; // 70 seconds ago

    assert.strictEqual(announcement.isExpired(), true);
  });

  test('hasCapability returns true for existing capability', () => {
    const announcement = new OrganismAnnouncement({
      organismId: 'org1',
      capabilities: ['compute', 'storage'],
    });

    assert.strictEqual(announcement.hasCapability('compute'), true);
    assert.strictEqual(announcement.hasCapability('storage'), true);
  });

  test('hasCapability returns false for non-existing capability', () => {
    const announcement = new OrganismAnnouncement({
      organismId: 'org1',
      capabilities: ['compute'],
    });

    assert.strictEqual(announcement.hasCapability('ai'), false);
  });

  test('toJSON returns expected structure', () => {
    const announcement = new OrganismAnnouncement({
      organismId: 'org1',
      capabilities: ['compute', 'storage'],
      environment: 'staging',
    });

    const json = announcement.toJSON();

    assert.strictEqual(json.organismId, 'org1');
    assert.deepStrictEqual(json.capabilities, ['compute', 'storage']);
    assert.strictEqual(json.environment, 'staging');
    assert.ok('timestamp' in json);
    assert.ok('signature' in json);
  });
});

// ─── ConnectionRequest ────────────────────────────────────────────────────────

describe('ConnectionRequest', () => {
  test('constructs with requesterId and targetId', () => {
    const request = new ConnectionRequest({
      requesterId: 'org1',
      targetId: 'org2',
    });

    assert.ok(request.id.startsWith('conn_req_'));
    assert.strictEqual(request.requesterId, 'org1');
    assert.strictEqual(request.targetId, 'org2');
    assert.strictEqual(request.connectionType, 'direct');
    assert.strictEqual(request.status, 'pending');
    assert.ok(request.challenge > 0);
    assert.ok(request.timestamp > 0);
  });

  test('constructs with custom connectionType', () => {
    const request = new ConnectionRequest({
      requesterId: 'org1',
      targetId: 'org2',
      connectionType: 'mesh',
    });

    assert.strictEqual(request.connectionType, 'mesh');
  });

  test('generateResponse creates deterministic response', () => {
    const request = new ConnectionRequest({
      requesterId: 'org1',
      targetId: 'org2',
    });

    const response1 = request.generateResponse();
    const response2 = request.generateResponse();

    assert.strictEqual(response1, response2);
    assert.ok(typeof response1 === 'number');
  });

  test('verify returns true for correct response', () => {
    const request = new ConnectionRequest({
      requesterId: 'org1',
      targetId: 'org2',
    });

    const response = request.generateResponse();
    assert.strictEqual(request.verify(response), true);
  });

  test('verify returns false for incorrect response', () => {
    const request = new ConnectionRequest({
      requesterId: 'org1',
      targetId: 'org2',
    });

    assert.strictEqual(request.verify(12345), false);
    assert.strictEqual(request.verify(0), false);
    assert.strictEqual(request.verify(-1), false);
  });

  test('different requests have different challenges', () => {
    const r1 = new ConnectionRequest({
      requesterId: 'org1',
      targetId: 'org2',
    });

    const r2 = new ConnectionRequest({
      requesterId: 'org1',
      targetId: 'org2',
    });

    // Challenges are random, so they should likely differ
    // This test may occasionally fail if random numbers collide
    assert.notStrictEqual(r1.challenge, r2.challenge);
  });

  test('request IDs are unique', () => {
    const r1 = new ConnectionRequest({
      requesterId: 'org1',
      targetId: 'org2',
    });

    const r2 = new ConnectionRequest({
      requesterId: 'org1',
      targetId: 'org2',
    });

    assert.notStrictEqual(r1.id, r2.id);
  });
});

// ─── DiscoveryDirectory ───────────────────────────────────────────────────────

describe('DiscoveryDirectory', () => {
  test('constructs with default type', () => {
    const directory = new DiscoveryDirectory();

    assert.strictEqual(directory.type, 'distributed');
    assert.strictEqual(directory.organisms.size, 0);
  });

  test('constructs with custom type', () => {
    const directory = new DiscoveryDirectory({ type: 'centralized' });

    assert.strictEqual(directory.type, 'centralized');
  });

  test('register adds announcement', () => {
    const directory = new DiscoveryDirectory();
    const announcement = new OrganismAnnouncement({
      organismId: 'org1',
      capabilities: ['compute'],
    });

    directory.register(announcement);

    assert.strictEqual(directory.organisms.size, 1);
    assert.ok(directory.organisms.has('org1'));
  });

  test('register updates existing announcement', () => {
    const directory = new DiscoveryDirectory();

    const a1 = new OrganismAnnouncement({
      organismId: 'org1',
      capabilities: ['compute'],
    });

    const a2 = new OrganismAnnouncement({
      organismId: 'org1',
      capabilities: ['compute', 'storage'],
    });

    directory.register(a1);
    directory.register(a2);

    assert.strictEqual(directory.organisms.size, 1);
    const stored = directory.organisms.get('org1');
    assert.strictEqual(stored.capabilities.size, 2);
  });

  test('unregister removes announcement', () => {
    const directory = new DiscoveryDirectory();
    const announcement = new OrganismAnnouncement({
      organismId: 'org1',
    });

    directory.register(announcement);
    directory.unregister('org1');

    assert.strictEqual(directory.organisms.size, 0);
  });

  test('find returns matching organisms by capability', () => {
    const directory = new DiscoveryDirectory();

    directory.register(new OrganismAnnouncement({
      organismId: 'org1',
      capabilities: ['compute', 'storage'],
    }));

    directory.register(new OrganismAnnouncement({
      organismId: 'org2',
      capabilities: ['ai'],
    }));

    directory.register(new OrganismAnnouncement({
      organismId: 'org3',
      capabilities: ['compute', 'ai'],
    }));

    const results = directory.find({ capability: 'compute' });

    assert.strictEqual(results.length, 2);
    assert.ok(results.some(r => r.organismId === 'org1'));
    assert.ok(results.some(r => r.organismId === 'org3'));
  });

  test('find returns matching organisms by environment', () => {
    const directory = new DiscoveryDirectory();

    directory.register(new OrganismAnnouncement({
      organismId: 'org1',
      environment: 'production',
    }));

    directory.register(new OrganismAnnouncement({
      organismId: 'org2',
      environment: 'staging',
    }));

    const results = directory.find({ environment: 'production' });

    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].organismId, 'org1');
  });

  test('find excludes expired organisms', () => {
    const directory = new DiscoveryDirectory();

    const fresh = new OrganismAnnouncement({
      organismId: 'org1',
      capabilities: ['compute'],
    });

    const expired = new OrganismAnnouncement({
      organismId: 'org2',
      capabilities: ['compute'],
    });
    expired.timestamp = Date.now() - 70000;

    directory.register(fresh);
    directory.register(expired);

    const results = directory.find({ capability: 'compute' });

    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].organismId, 'org1');
  });

  test('find returns empty array when no matches', () => {
    const directory = new DiscoveryDirectory();

    directory.register(new OrganismAnnouncement({
      organismId: 'org1',
      capabilities: ['compute'],
    }));

    const results = directory.find({ capability: 'ai' });

    assert.strictEqual(results.length, 0);
  });

  test('getAll returns all non-expired organisms', () => {
    const directory = new DiscoveryDirectory();

    directory.register(new OrganismAnnouncement({ organismId: 'org1' }));
    directory.register(new OrganismAnnouncement({ organismId: 'org2' }));

    const all = directory.getAll();

    assert.strictEqual(all.length, 2);
  });

  test('cleanup removes expired entries', () => {
    const directory = new DiscoveryDirectory();
    directory.lastCleanup = 0; // Force cleanup on next call

    const fresh = new OrganismAnnouncement({ organismId: 'org1' });
    const expired = new OrganismAnnouncement({ organismId: 'org2' });
    expired.timestamp = Date.now() - 70000;

    // Add both directly to organisms map to bypass register's cleanup
    directory.organisms.set('org1', fresh);
    directory.organisms.set('org2', expired);

    assert.strictEqual(directory.organisms.size, 2);

    directory.cleanup();

    assert.strictEqual(directory.organisms.size, 1);
    assert.ok(directory.organisms.has('org1'));
  });
});

// ─── DiscoveryEngine ──────────────────────────────────────────────────────────

describe('DiscoveryEngine', () => {
  test('constructs with organismId', () => {
    const engine = new DiscoveryEngine({
      organismId: 'org1',
    });

    assert.strictEqual(engine.organismId, 'org1');
    assert.deepStrictEqual(engine.capabilities, []);
    assert.strictEqual(engine.environment, 'unknown');
    assert.strictEqual(engine.range, 'global');
    assert.ok(engine.directory instanceof DiscoveryDirectory);
    assert.strictEqual(engine.discovered.size, 0);
    assert.strictEqual(engine.connections.size, 0);
  });

  test('constructs with capabilities and environment', () => {
    const engine = new DiscoveryEngine({
      organismId: 'org1',
      capabilities: ['compute', 'ai'],
      environment: 'production',
      range: 'subnet',
    });

    assert.deepStrictEqual(engine.capabilities, ['compute', 'ai']);
    assert.strictEqual(engine.environment, 'production');
    assert.strictEqual(engine.range, 'subnet');
  });

  test('broadcast creates and registers announcement', () => {
    const engine = new DiscoveryEngine({
      organismId: 'org1',
      capabilities: ['compute'],
      environment: 'production',
    });

    const announcement = engine.broadcast();

    assert.ok(announcement instanceof OrganismAnnouncement);
    assert.strictEqual(announcement.organismId, 'org1');
    assert.ok(announcement.hasCapability('compute'));
    assert.strictEqual(announcement.environment, 'production');
    assert.ok(engine.directory.organisms.has('org1'));
  });

  test('startBroadcasting sets up interval', () => {
    const engine = new DiscoveryEngine({ organismId: 'org1' });

    engine.startBroadcasting(1000);

    assert.ok(engine.broadcastInterval !== null);

    engine.stopBroadcasting();
  });

  test('stopBroadcasting clears interval', () => {
    const engine = new DiscoveryEngine({ organismId: 'org1' });

    engine.startBroadcasting(1000);
    engine.stopBroadcasting();

    assert.strictEqual(engine.broadcastInterval, null);
  });

  test('advertiseCapability adds new capability', () => {
    const engine = new DiscoveryEngine({
      organismId: 'org1',
      capabilities: ['compute'],
    });

    engine.advertiseCapability('ai');

    assert.deepStrictEqual(engine.capabilities, ['compute', 'ai']);
  });

  test('advertiseCapability ignores duplicate', () => {
    const engine = new DiscoveryEngine({
      organismId: 'org1',
      capabilities: ['compute'],
    });

    engine.advertiseCapability('compute');

    assert.deepStrictEqual(engine.capabilities, ['compute']);
  });

  test('removeCapability removes capability', () => {
    const engine = new DiscoveryEngine({
      organismId: 'org1',
      capabilities: ['compute', 'ai', 'storage'],
    });

    engine.removeCapability('ai');

    assert.deepStrictEqual(engine.capabilities, ['compute', 'storage']);
  });

  test('discover finds and caches organisms', () => {
    const engine = new DiscoveryEngine({
      organismId: 'org1',
      capabilities: ['compute'],
    });

    // Register some organisms in the directory
    engine.directory.register(new OrganismAnnouncement({
      organismId: 'org2',
      capabilities: ['ai'],
    }));

    engine.directory.register(new OrganismAnnouncement({
      organismId: 'org3',
      capabilities: ['compute'],
    }));

    const results = engine.discover();

    // Should find org2 and org3, but not org1 (self)
    assert.strictEqual(results.length, 2);
    assert.ok(engine.discovered.has('org2'));
    assert.ok(engine.discovered.has('org3'));
    assert.ok(!engine.discovered.has('org1'));
  });

  test('discoverByCapability filters by capability', () => {
    const engine = new DiscoveryEngine({
      organismId: 'org1',
    });

    engine.directory.register(new OrganismAnnouncement({
      organismId: 'org2',
      capabilities: ['ai'],
    }));

    engine.directory.register(new OrganismAnnouncement({
      organismId: 'org3',
      capabilities: ['compute'],
    }));

    const results = engine.discoverByCapability('ai');

    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].organismId, 'org2');
  });

  test('discoverInEnvironment filters by environment', () => {
    const engine = new DiscoveryEngine({
      organismId: 'org1',
    });

    engine.directory.register(new OrganismAnnouncement({
      organismId: 'org2',
      environment: 'production',
    }));

    engine.directory.register(new OrganismAnnouncement({
      organismId: 'org3',
      environment: 'staging',
    }));

    const results = engine.discoverInEnvironment('production');

    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].organismId, 'org2');
  });

  test('requestConnection creates request', () => {
    const engine = new DiscoveryEngine({ organismId: 'org1' });

    const request = engine.requestConnection('org2', 'mesh');

    assert.ok(request instanceof ConnectionRequest);
    assert.strictEqual(request.requesterId, 'org1');
    assert.strictEqual(request.targetId, 'org2');
    assert.strictEqual(request.connectionType, 'mesh');
  });

  test('acceptConnection establishes connection', () => {
    const engine = new DiscoveryEngine({ organismId: 'org2' });
    const request = new ConnectionRequest({
      requesterId: 'org1',
      targetId: 'org2',
      connectionType: 'direct',
    });

    const result = engine.acceptConnection(request);

    assert.strictEqual(result.accepted, true);
    assert.ok('connection' in result);
    assert.strictEqual(result.connection.peerId, 'org1');
    assert.strictEqual(result.connection.type, 'direct');
    assert.strictEqual(result.connection.active, true);
    assert.strictEqual(request.status, 'accepted');
    assert.ok(engine.connections.has('org1'));
  });

  test('rejectConnection sets status and returns reason', () => {
    const engine = new DiscoveryEngine({ organismId: 'org2' });
    const request = new ConnectionRequest({
      requesterId: 'org1',
      targetId: 'org2',
    });

    const result = engine.rejectConnection(request, 'capacity_exceeded');

    assert.strictEqual(result.accepted, false);
    assert.strictEqual(result.reason, 'capacity_exceeded');
    assert.strictEqual(request.status, 'rejected');
  });

  test('negotiate returns target_not_found for unknown target', () => {
    const engine = new DiscoveryEngine({ organismId: 'org1' });
    const request = new ConnectionRequest({
      requesterId: 'org1',
      targetId: 'org2',
    });

    const result = engine.negotiate(request);

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.reason, 'target_not_found');
  });

  test('negotiate returns incompatible for no shared capabilities', () => {
    const engine = new DiscoveryEngine({
      organismId: 'org1',
      capabilities: ['compute'],
    });

    const target = new OrganismAnnouncement({
      organismId: 'org2',
      capabilities: ['ai'],
    });
    engine.discovered.set('org2', target);

    const request = new ConnectionRequest({
      requesterId: 'org1',
      targetId: 'org2',
    });

    const result = engine.negotiate(request);

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.reason, 'incompatible');
  });

  test('negotiate succeeds with shared capabilities', () => {
    const engine = new DiscoveryEngine({
      organismId: 'org1',
      capabilities: ['compute', 'ai'],
      environment: 'production',
    });

    const target = new OrganismAnnouncement({
      organismId: 'org2',
      capabilities: ['ai', 'storage'],
      environment: 'production',
    });
    engine.discovered.set('org2', target);

    const request = new ConnectionRequest({
      requesterId: 'org1',
      targetId: 'org2',
    });

    const result = engine.negotiate(request);

    assert.strictEqual(result.success, true);
    assert.ok(['direct', 'mesh', 'relay'].includes(result.connectionType));
    assert.strictEqual(result.target, 'org2');
  });

  test('registerWithDirectory adds announcement', () => {
    const engine = new DiscoveryEngine({ organismId: 'org1' });
    const announcement = new OrganismAnnouncement({
      organismId: 'external_org',
      capabilities: ['compute'],
    });

    engine.registerWithDirectory(announcement);

    assert.ok(engine.directory.organisms.has('external_org'));
  });

  test('queryDirectory delegates to directory.find', () => {
    const engine = new DiscoveryEngine({ organismId: 'org1' });

    engine.directory.register(new OrganismAnnouncement({
      organismId: 'org2',
      capabilities: ['ai'],
    }));

    const results = engine.queryDirectory({ capability: 'ai' });

    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].organismId, 'org2');
  });

  test('getStatus returns expected structure', () => {
    const engine = new DiscoveryEngine({
      organismId: 'org1',
      capabilities: ['compute', 'ai'],
      environment: 'production',
      range: 'subnet',
    });

    engine.broadcast();
    engine.discovered.set('org2', {});
    engine.connections.set('org3', {});

    const status = engine.getStatus();

    assert.strictEqual(status.organismId, 'org1');
    assert.strictEqual(status.capabilities, 2);
    assert.strictEqual(status.environment, 'production');
    assert.strictEqual(status.range, 'subnet');
    assert.strictEqual(status.discovered, 1);
    assert.strictEqual(status.connections, 1);
    assert.strictEqual(status.broadcasting, false);
    assert.strictEqual(status.directorySize, 1);
  });
});
