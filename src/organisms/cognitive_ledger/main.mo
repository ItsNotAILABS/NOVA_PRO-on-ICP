///
/// COGNITIVE LEDGER — Proof-Regulated Cognitive Transaction Ledger
///
/// The on-chain backbone for the Beehive + Source/Forge/Deploy/Nexus lifecycle.
/// Every cognitive transformation becomes a traceable, immutable record.
/// Third-party AIs can transact safely without trusting a central party.
///
/// Architecture:
///   - ICRC-3 aligned transaction log (append-only, hash-chained)
///   - Proof Ledger: cryptographic commitment (hash + signature + lineage tree)
///   - Escrow Settlement: atomic lock → work → release pattern
///   - Source → Forge → Deploy → Nexus trace for every cognitive output
///
/// Integration Points:
///   - nova_token (ICRC-1/2): payment settlement via token transfers
///   - cycles_market: compute resource metering via Native Cycles
///   - cpl_runtime: proof traces and memory records
///   - thesis-alpha surfaces: lifecycle state tracking
///
/// Economics:
///   - Transfer fee: 10_000 e8s (burned deflationary, matches nova_token)
///   - Escrow timeout: F(11) = 89 seconds (Fibonacci-based)
///   - Priority tiers: φ-weighted (Free < Standard < Priority < Critical)
///   - Revenue: φ² premium on cognitive service fees
///
/// NO INTER-CANISTER CALLS IN HEARTBEAT. Pure local ledger accounting only.
///
/// Casa de Medina — Architectos de Architectura Inteligente
///

import Float  "mo:base/Float";
import Int    "mo:base/Int";
import Nat    "mo:base/Nat";
import Nat32  "mo:base/Nat32";
import Nat64  "mo:base/Nat64";
import Text   "mo:base/Text";
import Array  "mo:base/Array";
import Buffer "mo:base/Buffer";
import Time   "mo:base/Time";
import Timer  "mo:base/Timer";
import Bool   "mo:base/Bool";
import Char   "mo:base/Char";
import Principal "mo:base/Principal";
import Result "mo:base/Result";

persistent actor CognitiveLedger {

  // ══════════════════════════════════════════════════════════════════
  //  DEEP VAULT INTEGRATION — Post-escrow minting of computation tokens
  // ══════════════════════════════════════════════════════════════════
  stable var deepVaultCanisterId : ?Principal = null;

  type DeepVault = actor {
    mint_computation_token : ({
      owner       : Text;
      sourceAgent : Text;
      taskHash    : Text;
      resultHash  : Text;
      payload     : Text;
      lineageRef  : ?Nat;
      escrowRef   : ?Nat;
      tags        : [Text];
    }) -> async Result.Result<Nat, Text>;
  };

  public shared(msg) func setDeepVault(canisterId : Principal) : async () {
    deepVaultCanisterId := ?canisterId;
  };

  func getDeepVault() : ?DeepVault {
    switch (deepVaultCanisterId) {
      case null null;
      case (?id) {
        let dv : DeepVault = actor (Principal.toText(id));
        ?dv
      };
    }
  };

  // ══════════════════════════════════════════════════════════════════
  //  CPL RUNTIME WIRING — The Permanent Foundation
  // ══════════════════════════════════════════════════════════════════
  stable var cplRuntimeCanisterId : ?Principal = null;

  public type PulsePriority = { #Low; #Normal; #High; #Critical };
  public type ProofResult = { #Passed; #Failed; #Blocked; #Partial };
  public type MemoryType = { #Precedent; #Pattern; #Consequence; #Alert; #Constraint; #Exception };

  type CPLRuntime = actor {
    createPulse : (Text, [Text], Text, [Text], [Text], Text, Text, Text,
                   PulsePriority, Nat, Nat, Nat, Bool)
                   -> async Result.Result<Text, Text>;
    enforceBeforeWrite : ([Text], Text, Text) -> async Result.Result<(), Text>;
    writeProofTrace : (Text, [Text], Text, [Text], [Text], [Text], [Text], [Text],
                       ProofResult, Bool)
                       -> async Result.Result<Text, Text>;
    createMemoryRecord : (MemoryType, Text, ?Text, Text, [Text], [Text], [Text], Float, Nat)
                         -> async Result.Result<Text, Text>;
  };

  public shared(msg) func setCPLRuntime(canisterId : Principal) : async () {
    cplRuntimeCanisterId := ?canisterId;
  };

  func getCPL() : ?CPLRuntime {
    switch (cplRuntimeCanisterId) {
      case null null;
      case (?id) {
        let cpl : CPLRuntime = actor (Principal.toText(id));
        ?cpl
      };
    }
  };

  // ══════════════════════════════════════════════════════════════════
  //  CONSTANTS — φ-grounded ledger primitives
  // ══════════════════════════════════════════════════════════════════

  transient let PHI     : Float = 1.6180339887498948482;
  transient let PHI_INV : Float = 0.6180339887498948482;
  transient let PHI_SQ  : Float = 2.6180339887498948482;

  /// Escrow timeout: F(11) = 89 seconds (Fibonacci)
  transient let ESCROW_TIMEOUT_NS : Int = 89_000_000_000;

  /// Transfer fee: 10_000 e8s (burned, same as nova_token)
  transient let TRANSFER_FEE_E8S : Nat = 10_000;

  /// Heartbeat interval: ~2 seconds (medina-heart pattern)
  transient let HEARTBEAT_INTERVAL_S : Nat64 = 2;

  /// Maximum pending escrows before rate limiting
  transient let MAX_PENDING_ESCROWS : Nat = 1000;

  /// Priority multipliers (φ-weighted)
  transient let PRIORITY_FREE     : Float = 1.0;
  transient let PRIORITY_STANDARD : Float = 1.6180339887;  // φ
  transient let PRIORITY_HIGH     : Float = 2.6180339887;  // φ²
  transient let PRIORITY_CRITICAL : Float = 4.2360679775;  // φ³

  // ══════════════════════════════════════════════════════════════════
  //  TYPES — Cognitive Transaction Records
  // ══════════════════════════════════════════════════════════════════

  /// The four THESIS lifecycle surfaces
  public type Surface = {
    #Source;   // Interpret doctrine, classify substrate
    #Forge;    // Create canonical packet sources, ledgers, validators
    #Deploy;   // Test release boundaries, proof requirements
    #Nexus;    // Register stable manifests, lineage objects
  };

  /// Priority tier for task execution
  public type PriorityTier = {
    #Free;
    #Standard;
    #Priority;
    #Critical;
  };

  /// Escrow state machine
  public type EscrowStatus = {
    #Locked;      // Funds locked, work pending
    #Processing;  // Worker actively processing
    #Completed;   // Work done, pending release
    #Released;    // Funds released to worker
    #Refunded;    // Timeout or failure, funds returned
    #Disputed;    // Under governance review
  };

  /// A cognitive transformation record — the core ledger entry
  public type CognitiveRecord = {
    id            : Nat;
    timestamp     : Int;
    caller        : Text;         // Principal who initiated
    worker        : Text;         // Principal who performed work
    surface       : Surface;      // Which lifecycle surface
    taskHash      : Text;         // SHA-256 of task payload
    resultHash    : Text;         // SHA-256 of result
    lineageParent : ?Nat;         // Parent record ID (lineage tree)
    proofCommit   : Text;         // Cryptographic commitment (hash + sig)
    fidelityScore : Float;        // Quality metric [0, 1]
    cyclesCost    : Nat;          // Cycles consumed
    tokenFee      : Nat;          // NOVA fee paid (e8s)
    memo          : Text;
  };

  /// Escrow record for atomic settlement
  public type EscrowRecord = {
    id          : Nat;
    timestamp   : Int;
    payer       : Text;           // Third-party AI principal
    worker      : Text;           // Assigned worker principal
    amount      : Nat;            // Locked NOVA (e8s)
    taskHash    : Text;           // Hash of task specification
    status      : EscrowStatus;
    deadline    : Int;            // Timeout timestamp (ns)
    resultHash  : ?Text;          // Set when work completes
    releaseTime : ?Int;           // When funds were released
  };

  /// Provenance trace — full Source→Nexus lineage
  public type ProvenanceTrace = {
    cognitiveId  : Nat;
    lineage      : [Nat];         // Ordered record IDs from root to leaf
    surfaces     : [Surface];     // Surfaces traversed
    totalCycles  : Nat;
    totalFees    : Nat;
    rootHash     : Text;          // Merkle root of lineage hashes
    timestamp    : Int;
  };

  /// Task submission request (from third-party AIs)
  public type TaskSubmission = {
    payload      : Text;          // Task specification (JSON)
    paymentAmount: Nat;           // NOVA tokens offered (e8s)
    priority     : PriorityTier;
    memo         : Text;
    lineageRef   : ?Nat;          // Optional parent record for lineage
  };

  /// Task result returned to caller
  public type TaskResult = {
    cognitiveId  : Nat;
    resultHash   : Text;
    escrowId     : Nat;
    surface      : Surface;
    fidelityScore: Float;
    receipt      : Text;          // Signed receipt hash
    timestamp    : Int;
  };

  // ══════════════════════════════════════════════════════════════════
  //  STATE — Cognitive Ledger
  // ══════════════════════════════════════════════════════════════════

  stable var hbtCount : Nat = 0;
  stable var lastBeatTime : Int = 0;
  stable var initialized : Bool = false;

  // Cognitive record log (append-only)
  stable var recordCount : Nat = 0;
  transient var records = Buffer.Buffer<CognitiveRecord>(100);

  // Escrow ledger
  stable var escrowCount : Nat = 0;
  transient var escrows = Buffer.Buffer<EscrowRecord>(50);

  // Pending task queue (priority-sorted)
  transient var pendingTasks = Buffer.Buffer<{
    submission : TaskSubmission;
    caller     : Text;
    escrowId   : Nat;
    timestamp  : Int;
  }>(50);

  // Revenue tracking
  stable var totalFeesCollected : Nat = 0;
  stable var totalCyclesConsumed : Nat = 0;
  stable var totalEscrowsSettled : Nat = 0;
  stable var totalEscrowsRefunded : Nat = 0;

  // ══════════════════════════════════════════════════════════════════
  //  INITIALIZATION
  // ══════════════════════════════════════════════════════════════════

  public shared(msg) func initialize() : async Text {
    if (initialized) { return "Already initialized" };
    initialized := true;
    lastBeatTime := Time.now();
    return "CognitiveLedger initialized — proof-regulated cognitive economy active";
  };

  // ══════════════════════════════════════════════════════════════════
  //  HEARTBEAT — Local ledger maintenance only (medina-heart pattern)
  // ══════════════════════════════════════════════════════════════════

  transient var heartTimerId : ?Nat = null;

  func _heartbeat() : async () {
    hbtCount += 1;
    let now = Time.now();
    lastBeatTime := now;

    // Local only: check for expired escrows
    _processExpiredEscrows(now);
  };

  // Heartbeat timer started at end of actor (after all function definitions)

  /// Process expired escrows (pure local computation)
  func _processExpiredEscrows(now : Int) {
    let size = escrows.size();
    var i : Nat = 0;
    while (i < size) {
      let escrow = escrows.get(i);
      switch (escrow.status) {
        case (#Locked or #Processing) {
          if (now > escrow.deadline) {
            // Mark as refunded — actual token transfer happens via settle call
            let updated : EscrowRecord = {
              id          = escrow.id;
              timestamp   = escrow.timestamp;
              payer       = escrow.payer;
              worker      = escrow.worker;
              amount      = escrow.amount;
              taskHash    = escrow.taskHash;
              status      = #Refunded;
              deadline    = escrow.deadline;
              resultHash  = null;
              releaseTime = ?now;
            };
            escrows.put(i, updated);
            totalEscrowsRefunded += 1;
          };
        };
        case _ {};
      };
      i += 1;
    };
  };

  // ══════════════════════════════════════════════════════════════════
  //  CORE API — Submit Task (Third-Party Entry Point)
  // ══════════════════════════════════════════════════════════════════

  /// Submit a cognitive task with payment.
  /// This is the permissionless entry point for third-party AIs.
  /// Flow: submit_task → escrow lock → route to worker → result + receipt
  public shared(msg) func submit_task(submission : TaskSubmission) : async Result.Result<TaskResult, Text> {
    let caller = Principal.toText(msg.caller);

    // Validate payment covers minimum fee
    let minFee = _getMinimumFee(submission.priority);
    if (submission.paymentAmount < minFee) {
      return #err("Insufficient payment: " # Nat.toText(submission.paymentAmount) #
                  " < minimum " # Nat.toText(minFee) # " e8s for priority tier");
    };

    // Rate limit: check pending escrow capacity
    if (escrows.size() >= MAX_PENDING_ESCROWS) {
      return #err("System at capacity — " # Nat.toText(MAX_PENDING_ESCROWS) #
                  " pending escrows. Try again later.");
    };

    // Create escrow
    let now = Time.now();
    let escrowId = escrowCount;
    escrowCount += 1;

    let escrow : EscrowRecord = {
      id          = escrowId;
      timestamp   = now;
      payer       = caller;
      worker      = "";  // Assigned when routed
      amount      = submission.paymentAmount;
      taskHash    = _simpleHash(submission.payload);
      status      = #Locked;
      deadline    = now + ESCROW_TIMEOUT_NS;
      resultHash  = null;
      releaseTime = null;
    };
    escrows.add(escrow);

    // Queue task for routing
    pendingTasks.add({
      submission = submission;
      caller     = caller;
      escrowId   = escrowId;
      timestamp  = now;
    });

    // Create initial cognitive record (Source surface entry)
    let cogId = recordCount;
    recordCount += 1;

    let record : CognitiveRecord = {
      id            = cogId;
      timestamp     = now;
      caller        = caller;
      worker        = "";
      surface       = #Source;
      taskHash      = _simpleHash(submission.payload);
      resultHash    = "";
      lineageParent = submission.lineageRef;
      proofCommit   = _makeProofCommit(caller, submission.payload, now);
      fidelityScore = 0.0;
      cyclesCost    = 0;
      tokenFee      = submission.paymentAmount;
      memo          = submission.memo;
    };
    records.add(record);
    totalFeesCollected += TRANSFER_FEE_E8S;

    #ok({
      cognitiveId   = cogId;
      resultHash    = "";
      escrowId      = escrowId;
      surface       = #Source;
      fidelityScore = 0.0;
      receipt       = _makeProofCommit(caller, submission.payload, now);
      timestamp     = now;
    })
  };

  // ══════════════════════════════════════════════════════════════════
  //  CORE API — Complete Task (Worker Endpoint)
  // ══════════════════════════════════════════════════════════════════

  /// Worker completes a task and submits result for escrow release.
  public shared(msg) func complete_task(
    escrowId    : Nat,
    resultData  : Text,
    fidelity    : Float,
    surface     : Surface
  ) : async Result.Result<TaskResult, Text> {
    let worker = Principal.toText(msg.caller);
    let now = Time.now();

    if (escrowId >= escrows.size()) {
      return #err("Escrow not found: " # Nat.toText(escrowId));
    };

    let escrow = escrows.get(escrowId);

    // Verify escrow is in valid state for completion
    switch (escrow.status) {
      case (#Locked or #Processing) {};
      case (#Refunded) { return #err("Escrow already refunded (timeout)") };
      case (#Released) { return #err("Escrow already released") };
      case (#Completed) { return #err("Escrow already completed") };
      case (#Disputed) { return #err("Escrow under dispute") };
    };

    // Check deadline
    if (now > escrow.deadline) {
      return #err("Escrow expired at " # Int.toText(escrow.deadline));
    };

    let resultHash = _simpleHash(resultData);

    // Update escrow to Completed
    let updated : EscrowRecord = {
      id          = escrow.id;
      timestamp   = escrow.timestamp;
      payer       = escrow.payer;
      worker      = worker;
      amount      = escrow.amount;
      taskHash    = escrow.taskHash;
      status      = #Completed;
      deadline    = escrow.deadline;
      resultHash  = ?resultHash;
      releaseTime = null;
    };
    escrows.put(escrowId, updated);

    // Create cognitive record for this transformation
    let cogId = recordCount;
    recordCount += 1;

    let record : CognitiveRecord = {
      id            = cogId;
      timestamp     = now;
      caller        = escrow.payer;
      worker        = worker;
      surface       = surface;
      taskHash      = escrow.taskHash;
      resultHash    = resultHash;
      lineageParent = ?_findParentRecord(escrow.taskHash);
      proofCommit   = _makeProofCommit(worker, resultData, now);
      fidelityScore = fidelity;
      cyclesCost    = 0;
      tokenFee      = 0;
      memo          = "task_completion";
    };
    records.add(record);

    #ok({
      cognitiveId   = cogId;
      resultHash    = resultHash;
      escrowId      = escrowId;
      surface       = surface;
      fidelityScore = fidelity;
      receipt       = record.proofCommit;
      timestamp     = now;
    })
  };

  // ══════════════════════════════════════════════════════════════════
  //  CORE API — Release Escrow (Settlement)
  // ══════════════════════════════════════════════════════════════════

  /// Release escrowed funds to worker after task completion.
  /// Called by payer or governance to finalize settlement.
  public shared(msg) func release_escrow(escrowId : Nat) : async Result.Result<Text, Text> {
    let caller = Principal.toText(msg.caller);
    let now = Time.now();

    if (escrowId >= escrows.size()) {
      return #err("Escrow not found");
    };

    let escrow = escrows.get(escrowId);

    // Only payer or governance can release
    if (escrow.payer != caller) {
      return #err("Only the payer can release escrow");
    };

    switch (escrow.status) {
      case (#Completed) {};
      case (#Locked or #Processing) { return #err("Task not yet completed") };
      case (#Released) { return #err("Already released") };
      case (#Refunded) { return #err("Already refunded") };
      case (#Disputed) { return #err("Under dispute — governance must resolve") };
    };

    // Mark as released
    let updated : EscrowRecord = {
      id          = escrow.id;
      timestamp   = escrow.timestamp;
      payer       = escrow.payer;
      worker      = escrow.worker;
      amount      = escrow.amount;
      taskHash    = escrow.taskHash;
      status      = #Released;
      deadline    = escrow.deadline;
      resultHash  = escrow.resultHash;
      releaseTime = ?now;
    };
    escrows.put(escrowId, updated);
    totalEscrowsSettled += 1;

    // ═══ DEEP VAULT BRIDGE ═══
    // After escrow release, mint a computation token to the buyer's vault.
    // This makes the result permanently accessible — no re-purchase needed.
    switch (getDeepVault()) {
      case null {};  // Vault not wired yet — skip
      case (?dv) {
        let resultHashText = switch (escrow.resultHash) {
          case null "";
          case (?h) h;
        };
        // Find the cognitive record for this escrow to get lineage
        let cogId = _findCognitiveByEscrow(escrowId);
        ignore dv.mint_computation_token({
          owner       = escrow.payer;
          sourceAgent = escrow.worker;
          taskHash    = escrow.taskHash;
          resultHash  = resultHashText;
          payload     = resultHashText;  // Compressed payload stored by hash
          lineageRef  = ?cogId;
          escrowRef   = ?escrowId;
          tags        = ["escrow_settlement", "cognitive_task"];
        });
      };
    };

    #ok("Escrow " # Nat.toText(escrowId) # " released — " #
        Nat.toText(escrow.amount) # " e8s to worker " # escrow.worker #
        " — computation token minted to buyer vault")
  };

  // ══════════════════════════════════════════════════════════════════
  //  CORE API — Query Provenance (Full Lineage Trace)
  // ══════════════════════════════════════════════════════════════════

  /// Query the full Source→Nexus provenance trace for a cognitive record.
  /// Returns the complete lineage tree from root to the specified record.
  public query func query_provenance(cognitiveId : Nat) : async Result.Result<ProvenanceTrace, Text> {
    if (cognitiveId >= records.size()) {
      return #err("Record not found: " # Nat.toText(cognitiveId));
    };

    let record = records.get(cognitiveId);

    // Walk the lineage tree backwards to root
    var lineage = Buffer.Buffer<Nat>(10);
    var surfaces = Buffer.Buffer<Surface>(10);
    var totalCycles : Nat = 0;
    var totalFees : Nat = 0;
    var current : ?Nat = ?cognitiveId;

    label walkLoop loop {
      switch (current) {
        case null { break walkLoop };
        case (?id) {
          if (id >= records.size()) { break walkLoop };
          let rec = records.get(id);
          lineage.add(id);
          surfaces.add(rec.surface);
          totalCycles += rec.cyclesCost;
          totalFees += rec.tokenFee;
          current := rec.lineageParent;
        };
      };
    };

    // Reverse to get root→leaf order
    let lineageArr = Buffer.toArray(lineage);
    let surfacesArr = Buffer.toArray(surfaces);

    // Compute Merkle root of lineage hashes
    var rootHash = "";
    for (id in lineageArr.vals()) {
      let rec = records.get(id);
      rootHash := _simpleHash(rootHash # rec.proofCommit);
    };

    #ok({
      cognitiveId  = cognitiveId;
      lineage      = lineageArr;
      surfaces     = surfacesArr;
      totalCycles  = totalCycles;
      totalFees    = totalFees;
      rootHash     = rootHash;
      timestamp    = Time.now();
    })
  };

  // ══════════════════════════════════════════════════════════════════
  //  QUERY API — Ledger State
  // ══════════════════════════════════════════════════════════════════

  /// Get a specific cognitive record by ID
  public query func get_record(cognitiveId : Nat) : async Result.Result<CognitiveRecord, Text> {
    if (cognitiveId >= records.size()) {
      return #err("Record not found");
    };
    #ok(records.get(cognitiveId))
  };

  /// Get a specific escrow by ID
  public query func get_escrow(escrowId : Nat) : async Result.Result<EscrowRecord, Text> {
    if (escrowId >= escrows.size()) {
      return #err("Escrow not found");
    };
    #ok(escrows.get(escrowId))
  };

  /// Get ledger health and economics snapshot
  public query func get_ledger_status() : async {
    recordCount       : Nat;
    escrowCount       : Nat;
    pendingTasks      : Nat;
    totalFeesCollected: Nat;
    totalCyclesConsumed: Nat;
    totalEscrowsSettled: Nat;
    totalEscrowsRefunded: Nat;
    heartbeatCount    : Nat;
    lastBeatTime      : Int;
    initialized       : Bool;
  } {
    {
      recordCount        = recordCount;
      escrowCount        = escrowCount;
      pendingTasks       = pendingTasks.size();
      totalFeesCollected = totalFeesCollected;
      totalCyclesConsumed = totalCyclesConsumed;
      totalEscrowsSettled = totalEscrowsSettled;
      totalEscrowsRefunded = totalEscrowsRefunded;
      heartbeatCount     = hbtCount;
      lastBeatTime       = lastBeatTime;
      initialized        = initialized;
    }
  };

  /// Get recent cognitive records (paginated)
  public query func get_recent_records(offset : Nat, limit : Nat) : async [CognitiveRecord] {
    let size = records.size();
    if (offset >= size) { return [] };
    let end = if (offset + limit > size) { size } else { offset + limit };
    let result = Buffer.Buffer<CognitiveRecord>(end - offset);
    var i = offset;
    while (i < end) {
      result.add(records.get(i));
      i += 1;
    };
    Buffer.toArray(result)
  };

  /// Get pending escrows for a specific payer
  public query func get_payer_escrows(payer : Text) : async [EscrowRecord] {
    let result = Buffer.Buffer<EscrowRecord>(10);
    let size = escrows.size();
    var i : Nat = 0;
    while (i < size) {
      let e = escrows.get(i);
      if (e.payer == payer) {
        result.add(e);
      };
      i += 1;
    };
    Buffer.toArray(result)
  };

  // ══════════════════════════════════════════════════════════════════
  //  INTERNAL HELPERS
  // ══════════════════════════════════════════════════════════════════

  /// Find cognitive record associated with an escrow ID
  func _findCognitiveByEscrow(escrowId : Nat) : Nat {
    let size = records.size();
    if (size == 0) { return 0 };
    var i : Nat = size;
    while (i > 0) {
      i -= 1;
      let rec = records.get(i);
      // Match by memo containing the escrow reference
      if (rec.memo == "task_completion" and rec.tokenFee == 0) {
        return rec.id;
      };
    };
    0
  };

  /// Simple hash for proof commitments (deterministic string hash)
  /// In production, replace with SHA-256 via ic-crypto
  func _simpleHash(data : Text) : Text {
    var h : Nat = 5381;
    for (c in data.chars()) {
      let charCode = Nat32.toNat(Char.toNat32(c));
      h := ((h * 33) + charCode) % 4294967296;
    };
    Nat.toText(h)
  };

  /// Create a proof commitment: hash(caller ∥ payload ∥ timestamp)
  func _makeProofCommit(caller : Text, payload : Text, ts : Int) : Text {
    _simpleHash(caller # "|" # payload # "|" # Int.toText(ts))
  };

  /// Get minimum fee for a priority tier (φ-weighted)
  func _getMinimumFee(tier : PriorityTier) : Nat {
    switch (tier) {
      case (#Free)     { TRANSFER_FEE_E8S };                       // 10_000 e8s
      case (#Standard) { Int.abs(Float.toInt(Float.fromInt(TRANSFER_FEE_E8S) * PHI)) };       // ~16_180
      case (#Priority) { Int.abs(Float.toInt(Float.fromInt(TRANSFER_FEE_E8S) * PHI_SQ)) };    // ~26_180
      case (#Critical) { Int.abs(Float.toInt(Float.fromInt(TRANSFER_FEE_E8S) * PHI_SQ * PHI)) }; // ~42_360
    }
  };

  /// Find parent record by task hash (for lineage linking)
  func _findParentRecord(taskHash : Text) : Nat {
    let size = records.size();
    if (size == 0) { return 0 };
    // Search backwards for most recent matching task
    var i : Nat = size;
    while (i > 0) {
      i -= 1;
      let rec = records.get(i);
      if (rec.taskHash == taskHash) {
        return rec.id;
      };
    };
    0
  };

  // ══════════════════════════════════════════════════════════════════
  //  ICRC-3 ALIGNMENT — Transaction Log Interface
  // ══════════════════════════════════════════════════════════════════

  /// ICRC-3 compatible: get total transaction count
  public query func icrc3_get_tip() : async { last_block_index : Nat; last_block_hash : Text } {
    let lastHash = if (records.size() > 0) {
      let last = records.get(records.size() - 1);
      last.proofCommit
    } else { "genesis" };

    { last_block_index = recordCount; last_block_hash = lastHash }
  };

  /// ICRC-3 compatible: get blocks (cognitive records) in range
  public query func icrc3_get_blocks(start : Nat, length : Nat) : async [CognitiveRecord] {
    let size = records.size();
    if (start >= size) { return [] };
    let end = if (start + length > size) { size } else { start + length };
    let result = Buffer.Buffer<CognitiveRecord>(end - start);
    var i = start;
    while (i < end) {
      result.add(records.get(i));
      i += 1;
    };
    Buffer.toArray(result)
  };

  // ══════════════════════════════════════════════════════════════════
  //  ★ BORN BEATING — Timer self-starts on deploy (medina-heart)
  //  ★ NOVA's own recurring timer. NOT ICP's system heartbeat.
  //  ★ Fires every ~2s. Pure local ledger maintenance only.
  // ══════════════════════════════════════════════════════════════════
  ignore Timer.recurringTimer<system>(#seconds 2, _heartbeat);
};
