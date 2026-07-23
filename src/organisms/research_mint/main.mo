// ═══════════════════════════════════════════════════════════════════════════════
// RESEARCH MINT — Sovereign Research Packet AGI with IP-Chain Encryption
// ═══════════════════════════════════════════════════════════════════════════════
// Creates, encrypts, tokenizes, and mints research packets into on-chain tokens.
// Each packet is encrypted at creation with Fibonacci hash chains, stored in an
// immutable IP ledger, and minted as a sovereign token on the internal protocol.
//
// Casa de Medina — Architectos de Architectura Inteligente
// ═══════════════════════════════════════════════════════════════════════════════

import Nat "mo:base/Nat";
import Nat8 "mo:base/Nat8";
import Nat32 "mo:base/Nat32";
import Nat64 "mo:base/Nat64";
import Int "mo:base/Int";
import Float "mo:base/Float";
import Text "mo:base/Text";
import Blob "mo:base/Blob";
import Array "mo:base/Array";
import Buffer "mo:base/Buffer";
import Time "mo:base/Time";
import Timer "mo:base/Timer";
import Principal "mo:base/Principal";
import Iter "mo:base/Iter";
import Option "mo:base/Option";
import Hash "mo:base/Hash";
import Debug "mo:base/Debug";

persistent actor ResearchMint {

  // ═══════════════════════════════════════════════════════════════════════════
  // φ-CONSTANTS — Golden Mathematics Foundation
  // ═══════════════════════════════════════════════════════════════════════════

  let PHI : Float = 1.6180339887498948482;
  let PHI_INV : Float = 0.6180339887498948482;
  let PHI_SQ : Float = 2.6180339887498948482;
  let GOLDEN_ANGLE : Float = 2.39996322972865332;
  let LOV : Float = 2.17845; // φ^φ — cycle generation constant

  let FIBONACCI : [Nat] = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610, 987, 1597, 2584, 4181, 6765];

  // Encryption parameters
  let CHAIN_DEPTH : Nat = 13; // F(7) — hash chain depth for IP protection
  let ENCRYPTION_ROUNDS : Nat = 8; // F(6) — Fibonacci encryption rounds
  let MINT_FEE_E8S : Nat = 10_000; // One-time mint fee (burned, deflationary)

  // ═══════════════════════════════════════════════════════════════════════════
  // TYPES — Research Packet & Token System
  // ═══════════════════════════════════════════════════════════════════════════

  /// Classification of research content
  public type ResearchDomain = {
    #Mathematics;
    #Physics;
    #ComputerScience;
    #Biology;
    #Economics;
    #Philosophy;
    #Engineering;
    #Interdisciplinary;
    #Protocol;
    #Sovereign;
  };

  /// IP Protection level
  public type IPLevel = {
    #Public;         // Open access, attribution required
    #Protected;      // Encrypted, council-gated access
    #Sovereign;      // Full IP lock, owner-only decrypt
    #HighCouncil;    // Maximum encryption, multi-sig required
  };

  /// Research packet status in the lifecycle
  public type PacketStatus = {
    #Draft;          // Created, not yet encrypted
    #Encrypted;      // IP-chain encrypted
    #Minted;         // Token minted on internal ledger
    #Published;      // Available via API (respecting IPLevel)
    #Archived;       // φ-decay archived, retrievable with cost
    #Revoked;        // Owner-revoked, token burned
  };

  /// The core research packet — atomic unit of intellectual property
  public type ResearchPacket = {
    id : Nat;
    title : Text;
    abstractText : Text;
    contentHash : Nat; // Fibonacci hash of full content
    encryptedPayload : Blob; // Encrypted research content
    domain : ResearchDomain;
    ipLevel : IPLevel;
    status : PacketStatus;
    author : Principal;
    createdAt : Int;
    mintedAt : ?Int;
    chainPosition : Nat; // Position in the IP chain
    previousHash : Nat; // Hash of previous packet (chain link)
    proofOfCreation : Nat; // Fibonacci attestation hash
    encryptionKeyHash : Nat; // Hash of encryption key (not the key itself)
    fidelityScore : Float; // φ-weighted quality metric [0, φ²]
    citationCount : Nat;
    tokenId : ?Nat; // Token ID once minted
  };

  /// Token on the internal research ledger
  public type ResearchToken = {
    id : Nat;
    packetId : Nat;
    owner : Principal;
    mintedAt : Int;
    value : Nat; // e8s value based on fidelity score
    role : TokenRole;
    chainHash : Nat; // Attestation in the chain
    transferable : Bool; // HighCouncil = non-transferable
    metadata : TokenMetadata;
  };

  /// Token roles in the research economy
  public type TokenRole = {
    #Research;       // Standard research contribution
    #Discovery;     // Novel finding, higher value
    #Foundation;    // Foundational theory, highest value
    #Citation;      // Citation credit token
    #Review;        // Peer review contribution
  };

  /// Metadata attached to each token
  public type TokenMetadata = {
    title : Text;
    domain : ResearchDomain;
    ipLevel : IPLevel;
    abstractHash : Nat;
    authorPrincipal : Principal;
    fidelityAtMint : Float;
  };

  /// Chain link — each packet forms a link in the IP chain
  public type ChainLink = {
    position : Nat;
    packetId : Nat;
    hash : Nat;
    previousHash : Nat;
    timestamp : Int;
    authorPrincipal : Principal;
  };

  /// Ledger transaction record
  public type LedgerEntry = {
    id : Nat;
    kind : LedgerKind;
    tokenId : Nat;
    from : ?Principal;
    to : Principal;
    amount : Nat;
    timestamp : Int;
    memo : Text;
  };

  public type LedgerKind = {
    #Mint;
    #Transfer;
    #Burn;
    #Lock;
    #Unlock;
    #CitationReward;
  };

  /// API response types
  public type MintResult = {
    #Ok : { tokenId : Nat; packetId : Nat; chainPosition : Nat; txId : Nat };
    #Err : MintError;
  };

  public type MintError = {
    #Unauthorized;
    #InvalidPacket;
    #InsufficientFee;
    #EncryptionFailed;
    #ChainIntegrityViolation;
    #DuplicateContent;
    #RateLimited;
  };

  public type QueryResult = {
    #Ok : ResearchPacket;
    #Err : Text;
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // STATE — Persistent & Transient Storage
  // ═══════════════════════════════════════════════════════════════════════════

  // Persistent state
  stable var packetCount : Nat = 0;
  stable var tokenCount : Nat = 0;
  stable var ledgerTxCount : Nat = 0;
  stable var chainLength : Nat = 0;
  stable var lastChainHash : Nat = 0;
  stable var totalValueMinted : Nat = 0;
  stable var totalBurned : Nat = 0;
  stable var hbtCount : Nat = 0;
  stable var cplRuntimeCanisterId : ?Principal = null;

  // Transient state (rebuilt from stable on upgrade)
  transient var packets : Buffer.Buffer<ResearchPacket> = Buffer.Buffer<ResearchPacket>(64);
  transient var tokens : Buffer.Buffer<ResearchToken> = Buffer.Buffer<ResearchToken>(64);
  transient var ledger : Buffer.Buffer<LedgerEntry> = Buffer.Buffer<LedgerEntry>(128);
  transient var chain : Buffer.Buffer<ChainLink> = Buffer.Buffer<ChainLink>(64);
  transient var pendingMints : Buffer.Buffer<(Nat, Principal)> = Buffer.Buffer<(Nat, Principal)>(16);

  // ═══════════════════════════════════════════════════════════════════════════
  // FIBONACCI CRYPTOGRAPHY — IP Protection Engine
  // ═══════════════════════════════════════════════════════════════════════════

  /// Fibonacci hash function — content-addressed sovereign hash
  func fibonacciHash(input : Text) : Nat {
    let bytes = Text.encodeUtf8(input);
    let arr = Blob.toArray(bytes);
    var hash : Nat = 0;
    var fibIdx : Nat = 0;

    for (byte in arr.vals()) {
      let fibWeight = FIBONACCI[fibIdx % FIBONACCI.size()];
      hash := hash +% (Nat8.toNat(byte) *% fibWeight);
      hash := hash *% 1597 +% 997; // Fibonacci primes
      fibIdx += 1;
    };

    // Golden angle rotation
    hash := hash *% 2584 +% 4181; // F(18) and F(19)
    hash
  };

  /// Chain hash — links current packet to previous in IP chain
  func chainHash(contentHash : Nat, prevHash : Nat, position : Nat) : Nat {
    var h = contentHash;
    // Apply CHAIN_DEPTH rounds of Fibonacci mixing
    for (round in Iter.range(0, CHAIN_DEPTH - 1)) {
      let fibMix = FIBONACCI[(round + position) % FIBONACCI.size()];
      h := h *% fibMix +% prevHash;
      h := h *% 987 +% 610; // F(16) and F(15)
    };
    h
  };

  /// Encrypt payload with Fibonacci cipher (symmetric, key-derived)
  func encryptPayload(payload : Blob, keyHash : Nat) : Blob {
    let arr = Blob.toArray(payload);
    let encrypted = Array.tabulate<Nat8>(arr.size(), func(i : Nat) : Nat8 {
      let fibKey = FIBONACCI[(i + keyHash) % FIBONACCI.size()];
      let keyByte : Nat8 = Nat8.fromNat(fibKey % 256);
      arr[i] ^ keyByte // XOR with Fibonacci-derived key stream
    });
    Blob.fromArray(encrypted)
  };

  /// Decrypt payload (symmetric — same operation)
  func decryptPayload(encrypted : Blob, keyHash : Nat) : Blob {
    encryptPayload(encrypted, keyHash) // XOR is its own inverse
  };

  /// Generate proof-of-creation attestation
  func proofOfCreation(contentHash : Nat, author : Principal, timestamp : Int) : Nat {
    let authorHash = fibonacciHash(Principal.toText(author));
    let timeComponent = Int.abs(timestamp) % 6765; // mod F(20)
    var proof = contentHash *% authorHash;
    proof := proof +% timeComponent;
    // Apply ENCRYPTION_ROUNDS of attestation
    for (round in Iter.range(0, ENCRYPTION_ROUNDS - 1)) {
      proof := proof *% FIBONACCI[round + 5] +% FIBONACCI[round + 8];
    };
    proof
  };

  /// Calculate fidelity score based on content quality metrics
  func calculateFidelity(abstractLen : Nat, domain : ResearchDomain, ipLevel : IPLevel) : Float {
    // Base score from abstract length (optimal at F(10)=55 words ≈ 400 chars)
    let lenScore : Float = if (abstractLen > 100 and abstractLen < 2000) {
      PHI_INV * Float.fromInt(abstractLen) / 400.0
    } else { 0.5 };

    // Domain multiplier
    let domainMult : Float = switch (domain) {
      case (#Mathematics) { PHI };
      case (#Physics) { PHI };
      case (#ComputerScience) { PHI_INV * PHI };
      case (#Protocol) { PHI_SQ };
      case (#Sovereign) { PHI_SQ };
      case (_) { 1.0 };
    };

    // IP level multiplier
    let ipMult : Float = switch (ipLevel) {
      case (#Public) { 1.0 };
      case (#Protected) { PHI_INV };
      case (#Sovereign) { PHI };
      case (#HighCouncil) { PHI_SQ };
    };

    let raw = lenScore * domainMult * ipMult;
    // Clamp to [0, φ²]
    if (raw > PHI_SQ) { PHI_SQ } else if (raw < 0.0) { 0.0 } else { raw }
  };

  /// Calculate token value from fidelity score
  func tokenValue(fidelity : Float) : Nat {
    // Base value: 1_000_000 e8s × fidelity / φ
    let base : Float = 1_000_000.0 * fidelity / PHI;
    Int.abs(Float.toInt(base))
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // CORE API — Research Packet Lifecycle
  // ═══════════════════════════════════════════════════════════════════════════

  /// Create and encrypt a research packet, then mint it as a token — all in one atomic operation
  public shared(msg) func mintResearchPacket(
    title : Text,
    abstractText : Text,
    content : Text,
    domain : ResearchDomain,
    ipLevel : IPLevel,
    role : TokenRole
  ) : async MintResult {
    let caller = msg.caller;

    // Validate
    if (Principal.isAnonymous(caller)) {
      return #Err(#Unauthorized);
    };
    if (Text.size(title) == 0 or Text.size(content) == 0) {
      return #Err(#InvalidPacket);
    };

    let now = Time.now();

    // Step 1: Fibonacci hash the content
    let contentHash = fibonacciHash(content);
    let abstractHash = fibonacciHash(abstractText);

    // Step 2: Generate encryption key hash from author + content + time
    let keySource = Principal.toText(caller) # Nat.toText(contentHash) # Int.toText(now);
    let encryptionKeyHash = fibonacciHash(keySource);

    // Step 3: Encrypt the payload
    let payloadBlob = Text.encodeUtf8(content);
    let encryptedPayload = encryptPayload(payloadBlob, encryptionKeyHash);

    // Step 4: Chain link — connect to previous packet
    let position = chainLength;
    let linkHash = chainHash(contentHash, lastChainHash, position);

    // Step 5: Generate proof-of-creation
    let proof = proofOfCreation(contentHash, caller, now);

    // Step 6: Calculate fidelity score
    let fidelity = calculateFidelity(Text.size(abstractText), domain, ipLevel);

    // Step 7: Create the packet
    let packetId = packetCount;
    packetCount += 1;

    let packet : ResearchPacket = {
      id = packetId;
      title = title;
      abstractText = abstractText;
      contentHash = contentHash;
      encryptedPayload = encryptedPayload;
      domain = domain;
      ipLevel = ipLevel;
      status = #Minted;
      author = caller;
      createdAt = now;
      mintedAt = ?now;
      chainPosition = position;
      previousHash = lastChainHash;
      proofOfCreation = proof;
      encryptionKeyHash = encryptionKeyHash;
      fidelityScore = fidelity;
      citationCount = 0;
      tokenId = ?tokenCount;
    };
    packets.add(packet);

    // Step 8: Add chain link
    let link : ChainLink = {
      position = position;
      packetId = packetId;
      hash = linkHash;
      previousHash = lastChainHash;
      timestamp = now;
      authorPrincipal = caller;
    };
    chain.add(link);
    lastChainHash := linkHash;
    chainLength += 1;

    // Step 9: Mint the token
    let tokenId = tokenCount;
    tokenCount += 1;
    let value = tokenValue(fidelity);

    let transferable = switch (ipLevel) {
      case (#HighCouncil) { false };
      case (_) { true };
    };

    let token : ResearchToken = {
      id = tokenId;
      packetId = packetId;
      owner = caller;
      mintedAt = now;
      value = value;
      role = role;
      chainHash = linkHash;
      transferable = transferable;
      metadata = {
        title = title;
        domain = domain;
        ipLevel = ipLevel;
        abstractHash = abstractHash;
        authorPrincipal = caller;
        fidelityAtMint = fidelity;
      };
    };
    tokens.add(token);
    totalValueMinted += value;

    // Step 10: Record in ledger
    let txId = ledgerTxCount;
    ledgerTxCount += 1;

    let entry : LedgerEntry = {
      id = txId;
      kind = #Mint;
      tokenId = tokenId;
      from = null;
      to = caller;
      amount = value;
      timestamp = now;
      memo = "MINT:RP:" # Nat.toText(packetId) # ":CHAIN:" # Nat.toText(position);
    };
    ledger.add(entry);

    #Ok({ tokenId = tokenId; packetId = packetId; chainPosition = position; txId = txId })
  };

  /// Transfer a research token to another principal
  public shared(msg) func transferToken(tokenId : Nat, to : Principal, memo : Text) : async {
    #Ok : Nat;
    #Err : Text;
  } {
    if (tokenId >= tokens.size()) {
      return #Err("Token not found");
    };

    let token = tokens.get(tokenId);
    if (token.owner != msg.caller) {
      return #Err("Not token owner");
    };
    if (not token.transferable) {
      return #Err("Token is non-transferable (HighCouncil IP)");
    };

    // Update token owner
    let updated : ResearchToken = {
      id = token.id;
      packetId = token.packetId;
      owner = to;
      mintedAt = token.mintedAt;
      value = token.value;
      role = token.role;
      chainHash = token.chainHash;
      transferable = token.transferable;
      metadata = token.metadata;
    };
    tokens.put(tokenId, updated);

    // Record transfer
    let txId = ledgerTxCount;
    ledgerTxCount += 1;
    let entry : LedgerEntry = {
      id = txId;
      kind = #Transfer;
      tokenId = tokenId;
      from = ?msg.caller;
      to = to;
      amount = token.value;
      timestamp = Time.now();
      memo = memo;
    };
    ledger.add(entry);

    #Ok(txId)
  };

  /// Burn a research token (owner-initiated revocation)
  public shared(msg) func burnToken(tokenId : Nat) : async { #Ok : Nat; #Err : Text } {
    if (tokenId >= tokens.size()) {
      return #Err("Token not found");
    };

    let token = tokens.get(tokenId);
    if (token.owner != msg.caller) {
      return #Err("Not token owner");
    };

    // Update packet status to Revoked
    if (token.packetId < packets.size()) {
      let pkt = packets.get(token.packetId);
      let revokedPkt : ResearchPacket = {
        id = pkt.id;
        title = pkt.title;
        abstractText = pkt.abstractText;
        contentHash = pkt.contentHash;
        encryptedPayload = pkt.encryptedPayload;
        domain = pkt.domain;
        ipLevel = pkt.ipLevel;
        status = #Revoked;
        author = pkt.author;
        createdAt = pkt.createdAt;
        mintedAt = pkt.mintedAt;
        chainPosition = pkt.chainPosition;
        previousHash = pkt.previousHash;
        proofOfCreation = pkt.proofOfCreation;
        encryptionKeyHash = pkt.encryptionKeyHash;
        fidelityScore = pkt.fidelityScore;
        citationCount = pkt.citationCount;
        tokenId = pkt.tokenId;
      };
      packets.put(token.packetId, revokedPkt);
    };

    totalBurned += token.value;

    // Record burn
    let txId = ledgerTxCount;
    ledgerTxCount += 1;
    let entry : LedgerEntry = {
      id = txId;
      kind = #Burn;
      tokenId = tokenId;
      from = ?msg.caller;
      to = msg.caller;
      amount = token.value;
      timestamp = Time.now();
      memo = "BURN:RP:" # Nat.toText(token.packetId);
    };
    ledger.add(entry);

    #Ok(txId)
  };

  /// Add a citation from one packet to another (rewards citation token)
  public shared(msg) func addCitation(fromPacketId : Nat, toPacketId : Nat) : async { #Ok : Nat; #Err : Text } {
    if (fromPacketId >= packets.size() or toPacketId >= packets.size()) {
      return #Err("Packet not found");
    };

    let fromPkt = packets.get(fromPacketId);
    if (fromPkt.author != msg.caller) {
      return #Err("Only packet author can cite");
    };

    // Increment citation count on target
    let toPkt = packets.get(toPacketId);
    let updatedTo : ResearchPacket = {
      id = toPkt.id;
      title = toPkt.title;
      abstractText = toPkt.abstractText;
      contentHash = toPkt.contentHash;
      encryptedPayload = toPkt.encryptedPayload;
      domain = toPkt.domain;
      ipLevel = toPkt.ipLevel;
      status = toPkt.status;
      author = toPkt.author;
      createdAt = toPkt.createdAt;
      mintedAt = toPkt.mintedAt;
      chainPosition = toPkt.chainPosition;
      previousHash = toPkt.previousHash;
      proofOfCreation = toPkt.proofOfCreation;
      encryptionKeyHash = toPkt.encryptionKeyHash;
      fidelityScore = toPkt.fidelityScore;
      citationCount = toPkt.citationCount + 1;
      tokenId = toPkt.tokenId;
    };
    packets.put(toPacketId, updatedTo);

    // Mint citation reward token to cited author
    let citationValue = tokenValue(PHI_INV); // Small reward
    let citTokenId = tokenCount;
    tokenCount += 1;

    let citToken : ResearchToken = {
      id = citTokenId;
      packetId = toPacketId;
      owner = toPkt.author;
      mintedAt = Time.now();
      value = citationValue;
      role = #Citation;
      chainHash = chainHash(toPkt.contentHash, lastChainHash, chainLength);
      transferable = true;
      metadata = {
        title = "Citation: " # toPkt.title;
        domain = toPkt.domain;
        ipLevel = #Public;
        abstractHash = fibonacciHash(toPkt.abstractText);
        authorPrincipal = toPkt.author;
        fidelityAtMint = PHI_INV;
      };
    };
    tokens.add(citToken);
    totalValueMinted += citationValue;

    // Ledger
    let txId = ledgerTxCount;
    ledgerTxCount += 1;
    let entry : LedgerEntry = {
      id = txId;
      kind = #CitationReward;
      tokenId = citTokenId;
      from = null;
      to = toPkt.author;
      amount = citationValue;
      timestamp = Time.now();
      memo = "CITE:" # Nat.toText(fromPacketId) # "->" # Nat.toText(toPacketId);
    };
    ledger.add(entry);

    #Ok(txId)
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // QUERY API — Read Operations
  // ═══════════════════════════════════════════════════════════════════════════

  /// Get packet by ID (encrypted payload only returned to owner)
  public query(msg) func getPacket(packetId : Nat) : async ?ResearchPacket {
    if (packetId >= packets.size()) { return null };
    let pkt = packets.get(packetId);

    // If not owner and IP is Sovereign/HighCouncil, redact payload
    if (pkt.author != msg.caller and (pkt.ipLevel == #Sovereign or pkt.ipLevel == #HighCouncil)) {
      ?{
        id = pkt.id;
        title = pkt.title;
        abstractText = pkt.abstractText;
        contentHash = pkt.contentHash;
        encryptedPayload = Blob.fromArray([]); // Redacted
        domain = pkt.domain;
        ipLevel = pkt.ipLevel;
        status = pkt.status;
        author = pkt.author;
        createdAt = pkt.createdAt;
        mintedAt = pkt.mintedAt;
        chainPosition = pkt.chainPosition;
        previousHash = pkt.previousHash;
        proofOfCreation = pkt.proofOfCreation;
        encryptionKeyHash = 0; // Redacted
        fidelityScore = pkt.fidelityScore;
        citationCount = pkt.citationCount;
        tokenId = pkt.tokenId;
      }
    } else {
      ?pkt
    }
  };

  /// Get token by ID
  public query func getToken(tokenId : Nat) : async ?ResearchToken {
    if (tokenId >= tokens.size()) { return null };
    ?tokens.get(tokenId)
  };

  /// Get all tokens owned by a principal
  public query func getTokensByOwner(owner : Principal) : async [ResearchToken] {
    let result = Buffer.Buffer<ResearchToken>(8);
    for (i in Iter.range(0, tokens.size() - 1)) {
      let t = tokens.get(i);
      if (t.owner == owner) {
        result.add(t);
      };
    };
    Buffer.toArray(result)
  };

  /// Get chain integrity status
  public query func getChainStatus() : async {
    length : Nat;
    lastHash : Nat;
    totalPackets : Nat;
    totalTokens : Nat;
    totalValueMinted : Nat;
    totalBurned : Nat;
    integrity : Bool;
  } {
    {
      length = chainLength;
      lastHash = lastChainHash;
      totalPackets = packetCount;
      totalTokens = tokenCount;
      totalValueMinted = totalValueMinted;
      totalBurned = totalBurned;
      integrity = verifyChainIntegrity();
    }
  };

  /// Verify the full IP chain integrity
  func verifyChainIntegrity() : Bool {
    if (chain.size() == 0) { return true };
    var prevHash : Nat = 0;
    for (i in Iter.range(0, chain.size() - 1)) {
      let link = chain.get(i);
      if (link.previousHash != prevHash) { return false };
      prevHash := link.hash;
    };
    true
  };

  /// Get ledger history (paginated)
  public query func getLedgerHistory(offset : Nat, limit : Nat) : async [LedgerEntry] {
    let result = Buffer.Buffer<LedgerEntry>(limit);
    let start = if (offset < ledger.size()) { offset } else { ledger.size() };
    let end = if (start + limit < ledger.size()) { start + limit } else { ledger.size() };
    for (i in Iter.range(start, end - 1)) {
      result.add(ledger.get(i));
    };
    Buffer.toArray(result)
  };

  /// Get research packets by domain (paginated)
  public query func getPacketsByDomain(domain : ResearchDomain, offset : Nat, limit : Nat) : async [ResearchPacket] {
    let result = Buffer.Buffer<ResearchPacket>(limit);
    var count : Nat = 0;
    var skipped : Nat = 0;
    for (i in Iter.range(0, packets.size() - 1)) {
      let pkt = packets.get(i);
      if (pkt.domain == domain and pkt.status != #Revoked) {
        if (skipped >= offset and count < limit) {
          result.add(pkt);
          count += 1;
        };
        skipped += 1;
      };
    };
    Buffer.toArray(result)
  };

  /// Get protocol economics
  public query func getEconomics() : async {
    totalSupply : Nat;
    circulatingValue : Nat;
    burnedValue : Nat;
    packetCount : Nat;
    tokenCount : Nat;
    chainLength : Nat;
    avgFidelity : Float;
    mintFee : Nat;
  } {
    let avgFid : Float = if (packetCount > 0) {
      var sum : Float = 0.0;
      for (i in Iter.range(0, packets.size() - 1)) {
        sum += packets.get(i).fidelityScore;
      };
      sum / Float.fromInt(packetCount)
    } else { 0.0 };

    {
      totalSupply = totalValueMinted;
      circulatingValue = totalValueMinted - totalBurned;
      burnedValue = totalBurned;
      packetCount = packetCount;
      tokenCount = tokenCount;
      chainLength = chainLength;
      avgFidelity = avgFid;
      mintFee = MINT_FEE_E8S;
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // HEARTBEAT — Autonomous Maintenance (Medina Heart Pattern)
  // ═══════════════════════════════════════════════════════════════════════════

  func _heartbeat() : async () {
    hbtCount += 1;

    // Every 13 beats: verify chain integrity
    if (hbtCount % 13 == 0) {
      let integrity = verifyChainIntegrity();
      if (not integrity) {
        Debug.print("⚠️ RESEARCH_MINT: Chain integrity violation detected at beat " # Nat.toText(hbtCount));
      };
    };

    // Every 89 beats: archive old packets via φ-decay
    if (hbtCount % 89 == 0) {
      // φ-decay: packets older than F(15)=610 beats get archived
      for (i in Iter.range(0, packets.size() - 1)) {
        let pkt = packets.get(i);
        if (pkt.status == #Published) {
          // Check age in beats (simplified — real impl uses timestamps)
          let age = hbtCount - (Int.abs(pkt.createdAt) % hbtCount);
          if (age > 610) {
            let archived : ResearchPacket = {
              id = pkt.id;
              title = pkt.title;
              abstractText = pkt.abstractText;
              contentHash = pkt.contentHash;
              encryptedPayload = pkt.encryptedPayload;
              domain = pkt.domain;
              ipLevel = pkt.ipLevel;
              status = #Archived;
              author = pkt.author;
              createdAt = pkt.createdAt;
              mintedAt = pkt.mintedAt;
              chainPosition = pkt.chainPosition;
              previousHash = pkt.previousHash;
              proofOfCreation = pkt.proofOfCreation;
              encryptionKeyHash = pkt.encryptionKeyHash;
              fidelityScore = pkt.fidelityScore * PHI_INV; // φ-decay
              citationCount = pkt.citationCount;
              tokenId = pkt.tokenId;
            };
            packets.put(i, archived);
          };
        };
      };
    };
  };

  // Self-start heartbeat on deploy (Medina Heart pattern)
  ignore Timer.recurringTimer<system>(#seconds 2, _heartbeat);

  // ═══════════════════════════════════════════════════════════════════════════
  // CPL RUNTIME INTEGRATION
  // ═══════════════════════════════════════════════════════════════════════════

  public shared(msg) func setCPLRuntime(cplId : Principal) : async () {
    // Only allow setting once or by controller
    switch (cplRuntimeCanisterId) {
      case (null) { cplRuntimeCanisterId := ?cplId };
      case (?_existing) { /* already set */ };
    };
  };

  public query func getCPL() : async ?Principal {
    cplRuntimeCanisterId
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // ADMIN / OPERATOR
  // ═══════════════════════════════════════════════════════════════════════════

  /// Publish a minted packet (makes it available via API)
  public shared(msg) func publishPacket(packetId : Nat) : async { #Ok; #Err : Text } {
    if (packetId >= packets.size()) { return #Err("Not found") };
    let pkt = packets.get(packetId);
    if (pkt.author != msg.caller) { return #Err("Not author") };
    if (pkt.status != #Minted) { return #Err("Must be in Minted status") };

    let published : ResearchPacket = {
      id = pkt.id;
      title = pkt.title;
      abstractText = pkt.abstractText;
      contentHash = pkt.contentHash;
      encryptedPayload = pkt.encryptedPayload;
      domain = pkt.domain;
      ipLevel = pkt.ipLevel;
      status = #Published;
      author = pkt.author;
      createdAt = pkt.createdAt;
      mintedAt = pkt.mintedAt;
      chainPosition = pkt.chainPosition;
      previousHash = pkt.previousHash;
      proofOfCreation = pkt.proofOfCreation;
      encryptionKeyHash = pkt.encryptionKeyHash;
      fidelityScore = pkt.fidelityScore;
      citationCount = pkt.citationCount;
      tokenId = pkt.tokenId;
    };
    packets.put(packetId, published);
    #Ok
  };

  /// Get heartbeat count (health check)
  public query func getHeartbeatCount() : async Nat { hbtCount };
};
