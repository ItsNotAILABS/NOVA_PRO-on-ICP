import Principal "mo:base/Principal";
import Time "mo:base/Time";
import Int "mo:base/Int";
import Nat "mo:base/Nat";
import Buffer "mo:base/Buffer";
import HashMap "mo:base/HashMap";
import Hash "mo:base/Hash";
import Iter "mo:base/Iter";
import Array "mo:base/Array";
import Option "mo:base/Option";
import Result "mo:base/Result";
import Text "mo:base/Text";

actor CryptoDefense {
    let PHI : Float = 1.6180339887498948482;
    let EMERGENCE : Float = 0.6180339887498948;
    
    public type Role = { #Admin; #Minter; #Operator; #Guardian };
    public type ThreatLevel = { #Normal; #Elevated; #High; #Critical; #Emergency };
    
    type RateLimit = { count: Nat; windowStart: Int; maxPerWindow: Nat; windowNs: Nat };
    type Authorization = { principal: Principal; roles: [Role]; addedAt: Int; active: Bool };
    type CircuitBreaker = { tripped: Bool; tripCount: Nat; lastTrip: Int; cooldownNs: Nat };
    type TransferRecord = { amount: Nat; timestamp: Int; from: Principal; to: Principal };
    
    stable var paused : Bool = false;
    stable var threatLevel : ThreatLevel = #Normal;
    stable var owner : Principal = Principal.fromText("aaaaa-aa");
    
    var authorizations = HashMap.HashMap<Principal, Authorization>(16, Principal.equal, Principal.hash);
    var rateLimits = HashMap.HashMap<Principal, RateLimit>(64, Principal.equal, Principal.hash);
    var circuitBreakers = HashMap.HashMap<Text, CircuitBreaker>(16, Text.equal, Text.hash);
    var blacklist = HashMap.HashMap<Principal, Int>(32, Principal.equal, Principal.hash);
    var recentTransfers = Buffer.Buffer<TransferRecord>(100);
    var reentrancyLock : Bool = false;
    
    public shared(msg) func initialize(newOwner: Principal) : async Result.Result<(), Text> {
        if (owner != Principal.fromText("aaaaa-aa")) return #err("Already initialized");
        owner := newOwner;
        authorizations.put(newOwner, { principal = newOwner; roles = [#Admin, #Minter, #Operator, #Guardian]; addedAt = Time.now(); active = true });
        #ok(())
    };
    
    public shared(msg) func grantRole(target: Principal, role: Role) : async Result.Result<(), Text> {
        if (not hasRole(msg.caller, #Admin)) return #err("Unauthorized");
        let existing = Option.get(authorizations.get(target), { principal = target; roles = []; addedAt = Time.now(); active = true });
        let newRoles = Buffer.Buffer<Role>(4);
        for (r in existing.roles.vals()) { newRoles.add(r) };
        newRoles.add(role);
        authorizations.put(target, { principal = target; roles = Buffer.toArray(newRoles); addedAt = existing.addedAt; active = true });
        #ok(())
    };
    
    public shared(msg) func revokeRole(target: Principal, role: Role) : async Result.Result<(), Text> {
        if (not hasRole(msg.caller, #Admin)) return #err("Unauthorized");
        switch (authorizations.get(target)) {
            case null { #err("Not found") };
            case (?auth) {
                let newRoles = Array.filter<Role>(auth.roles, func(r) { r != role });
                authorizations.put(target, { principal = target; roles = newRoles; addedAt = auth.addedAt; active = true });
                #ok(())
            }
        }
    };
    
    public query func hasRole(p: Principal, role: Role) : async Bool {
        switch (authorizations.get(p)) {
            case null { false };
            case (?auth) { auth.active and Array.find<Role>(auth.roles, func(r) { r == role }) != null }
        }
    };
    
    func hasRoleSync(p: Principal, role: Role) : Bool {
        switch (authorizations.get(p)) {
            case null { false };
            case (?auth) { auth.active and Array.find<Role>(auth.roles, func(r) { r == role }) != null }
        }
    };
    
    public shared(msg) func checkRateLimit(target: Principal, maxPerWindow: Nat, windowNs: Nat) : async Result.Result<(), Text> {
        let now = Time.now();
        switch (rateLimits.get(target)) {
            case null {
                rateLimits.put(target, { count = 1; windowStart = now; maxPerWindow; windowNs });
                #ok(())
            };
            case (?limit) {
                if (now - limit.windowStart > limit.windowNs) {
                    rateLimits.put(target, { count = 1; windowStart = now; maxPerWindow; windowNs });
                    #ok(())
                } else if (limit.count >= maxPerWindow) {
                    #err("Rate limit exceeded")
                } else {
                    rateLimits.put(target, { count = limit.count + 1; windowStart = limit.windowStart; maxPerWindow; windowNs });
                    #ok(())
                }
            }
        }
    };
    
    public shared(msg) func addToBlacklist(target: Principal) : async Result.Result<(), Text> {
        if (not hasRoleSync(msg.caller, #Guardian) and not hasRoleSync(msg.caller, #Admin)) return #err("Unauthorized");
        blacklist.put(target, Time.now());
        #ok(())
    };
    
    public shared(msg) func removeFromBlacklist(target: Principal) : async Result.Result<(), Text> {
        if (not hasRoleSync(msg.caller, #Admin)) return #err("Unauthorized");
        blacklist.delete(target);
        #ok(())
    };
    
    public query func isBlacklisted(target: Principal) : async Bool {
        blacklist.get(target) != null
    };
    
    public shared(msg) func setPaused(p: Bool) : async Result.Result<(), Text> {
        if (not hasRoleSync(msg.caller, #Admin) and not hasRoleSync(msg.caller, #Guardian)) return #err("Unauthorized");
        paused := p;
        #ok(())
    };
    
    public query func isPaused() : async Bool { paused };
    
    public shared(msg) func setThreatLevel(level: ThreatLevel) : async Result.Result<(), Text> {
        if (not hasRoleSync(msg.caller, #Guardian) and not hasRoleSync(msg.caller, #Admin)) return #err("Unauthorized");
        threatLevel := level;
        if (level == #Emergency or level == #Critical) { paused := true };
        #ok(())
    };
    
    public query func getThreatLevel() : async ThreatLevel { threatLevel };
    
    public shared(msg) func tripCircuitBreaker(name: Text) : async Result.Result<(), Text> {
        if (not hasRoleSync(msg.caller, #Guardian) and not hasRoleSync(msg.caller, #Admin)) return #err("Unauthorized");
        let now = Time.now();
        let cooldown = 300_000_000_000;
        switch (circuitBreakers.get(name)) {
            case null { circuitBreakers.put(name, { tripped = true; tripCount = 1; lastTrip = now; cooldownNs = cooldown }) };
            case (?cb) { circuitBreakers.put(name, { tripped = true; tripCount = cb.tripCount + 1; lastTrip = now; cooldownNs = cooldown }) }
        };
        #ok(())
    };
    
    public shared(msg) func resetCircuitBreaker(name: Text) : async Result.Result<(), Text> {
        if (not hasRoleSync(msg.caller, #Admin)) return #err("Unauthorized");
        circuitBreakers.delete(name);
        #ok(())
    };
    
    public query func isCircuitTripped(name: Text) : async Bool {
        switch (circuitBreakers.get(name)) {
            case null { false };
            case (?cb) { cb.tripped and (Time.now() - cb.lastTrip < cb.cooldownNs) }
        }
    };
    
    public func acquireReentrancyLock() : async Result.Result<(), Text> {
        if (reentrancyLock) return #err("Reentrancy detected");
        reentrancyLock := true;
        #ok(())
    };
    
    public func releaseReentrancyLock() : async () {
        reentrancyLock := false
    };
    
    public func recordTransfer(from: Principal, to: Principal, amount: Nat) : async () {
        recentTransfers.add({ amount; timestamp = Time.now(); from; to });
        if (recentTransfers.size() > 1000) { ignore recentTransfers.removeLast() }
    };
    
    public query func detectAnomaly(target: Principal, amount: Nat, windowNs: Nat, maxAmount: Nat, maxCount: Nat) : async Bool {
        let now = Time.now();
        var totalAmount : Nat = 0;
        var count : Nat = 0;
        for (t in recentTransfers.vals()) {
            if ((t.from == target or t.to == target) and now - t.timestamp < windowNs) {
                totalAmount += t.amount;
                count += 1
            }
        };
        totalAmount + amount > maxAmount or count >= maxCount
    };
    
    public query func getSecurityStatus() : async { paused: Bool; threatLevel: ThreatLevel; blacklistSize: Nat; activeCircuits: Nat } {
        var activeCircuits : Nat = 0;
        for ((_, cb) in circuitBreakers.entries()) { if (cb.tripped) { activeCircuits += 1 } };
        { paused; threatLevel; blacklistSize = Iter.size(blacklist.entries()); activeCircuits }
    };
    
    public shared(msg) func validateTransfer(from: Principal, to: Principal, amount: Nat) : async Result.Result<(), Text> {
        if (paused) return #err("System paused");
        if (blacklist.get(from) != null) return #err("Sender blacklisted");
        if (blacklist.get(to) != null) return #err("Recipient blacklisted");
        
        let windowNs = 3600_000_000_000;
        let maxAmount = 1_000_000_000_000;
        let maxCount = 100;
        
        let isAnomalous = await detectAnomaly(from, amount, windowNs, maxAmount, maxCount);
        if (isAnomalous and threatLevel != #Normal) return #err("Anomalous transfer blocked");
        
        #ok(())
    };
    
    public shared(msg) func validateMint(minter: Principal, amount: Nat) : async Result.Result<(), Text> {
        if (paused) return #err("System paused");
        if (not hasRoleSync(minter, #Minter) and not hasRoleSync(minter, #Admin)) return #err("Not authorized to mint");
        if (amount > 10_000_000_000_000) return #err("Mint amount exceeds limit");
        #ok(())
    };
    
    public shared(msg) func emergencyShutdown() : async Result.Result<(), Text> {
        if (not hasRoleSync(msg.caller, #Admin)) return #err("Unauthorized");
        paused := true;
        threatLevel := #Emergency;
        #ok(())
    };
}
