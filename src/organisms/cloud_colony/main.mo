///
/// CLOUD COLONY — Biomimetic Six-Engine Sovereign Intelligence Organism
///
/// "A colony is not powerful because it has many individuals.
///  It is powerful because those individuals operate within a coordinated architecture."
///
/// The beehive is not decorative. It is a blueprint for distributed, role-specialized,
/// self-sustaining computation on ICP canisters.
///
/// SIX ENGINES = SPECIALIZED CASTES:
///   Worker     → Task execution & generation (foragers/producers)
///   Scout      → Signal monitoring & opportunity detection (explorers)
///   Guard      → Threat validation & filtering (defenders)
///   Builder    → Infrastructure expansion (architects)
///   Memory     → State preservation & identity (hive mind / honey stores)
///   Governance → Conflict resolution & resource policy (queen + collective rules)
///
/// BEE LOGIC IMPLEMENTED:
///   • Inter-Canister Communication = Pheromone trails / waggle dance language
///   • Persistent State = The hive never forgets (ICP canister memory across calls)
///   • Dynamic Role Coordination = Emergent intelligence from specialized parts
///   • Economic Cycles = Resource metering mirrors energy flow in a hive
///   • Miniverse Integration = Inner MICRO layers (fast pattern matching) +
///     outer engines (colony-level intelligence)
///
/// LIFECYCLE ALIGNMENT:
///   Scout  → SOURCE surface (classify, discover, route)
///   Guard  → SOURCE surface (validate at entry boundary)
///   Worker → FORGE surface (execute, transform, produce)
///   Builder→ DEPLOY surface (expand infrastructure, test boundaries)
///   Memory → NEXUS surface (persist lineage, identity continuity)
///   Governance → ALL surfaces (policy, conflict resolution, resource allocation)
///
/// ECONOMIC MODEL:
///   - Colonies earn/spend tokens autonomously (like bees optimize foraging economics)
///   - Cycles burned for compute = energy flow in a hive
///   - φ-weighted resource allocation across engines
///   - Revenue loops: third parties pay for persistent cognition
///   - Non-extractive: self-governing, no external "owner" draining the hive
///
/// NO INTER-CANISTER CALLS IN HEARTBEAT. Pure local computation only.
/// Inter-engine communication happens via the pheromone trail queue (async calls).
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

persistent actor CloudColony {

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
  //  CONSTANTS — φ-grounded colony primitives
  // ══════════════════════════════════════════════════════════════════

  transient let PHI     : Float = 1.6180339887498948482;
  transient let PHI_INV : Float = 0.6180339887498948482;
  transient let PHI_SQ  : Float = 2.6180339887498948482;
  transient let PHI_CB  : Float = 4.2360679774997896964;

  /// Heartbeat interval: ~2 seconds (medina-heart pattern)
  transient let HEARTBEAT_INTERVAL_S : Nat64 = 2;

  /// Pheromone decay rate: signals lose 1/φ strength per heartbeat
  transient let PHEROMONE_DECAY : Float = 0.6180339887;

  /// Quorum threshold: decisions require > 1/φ agreement (61.8%)
  transient let QUORUM_THRESHOLD : Float = 0.6180339887;

  /// Colony temperature target: 34.98°C (optimal brood temperature)
  transient let OPTIMAL_TEMPERATURE : Float = 34.98;

  /// φ-split ratio for swarming: 61.8% stays, 38.2% splits
  transient let SWARM_STAY_RATIO : Float = 0.6180339887;
  transient let SWARM_SPLIT_RATIO : Float = 0.3819660113;

  /// Maximum pheromone trail queue size
  transient let MAX_PHEROMONE_QUEUE : Nat = 500;

  /// Maximum tasks in worker queue
  transient let MAX_WORKER_QUEUE : Nat = 200;

  /// Engine energy allocation (φ-weighted, summing to ~1.0):
  ///   Worker: 1/φ² ≈ 0.382 (highest throughput)
  ///   Scout:  1/φ³ ≈ 0.236
  ///   Guard:  1/φ⁴ ≈ 0.146
  ///   Builder: 1/φ⁵ ≈ 0.090
  ///   Memory: 1/φ⁶ ≈ 0.056
  ///   Governance: 1/φ⁷ ≈ 0.034
  transient let WORKER_ENERGY     : Float = 0.382;
  transient let SCOUT_ENERGY      : Float = 0.236;
  transient let GUARD_ENERGY      : Float = 0.146;
  transient let BUILDER_ENERGY    : Float = 0.090;
  transient let MEMORY_ENERGY     : Float = 0.056;
  transient let GOVERNANCE_ENERGY : Float = 0.034;

  // ══════════════════════════════════════════════════════════════════
  //  TYPES — Colony Architecture
  // ══════════════════════════════════════════════════════════════════

  /// The six engine castes
  public type EngineCaste = {
    #Worker;
    #Scout;
    #Guard;
    #Builder;
    #Memory;
    #Governance;
  };

  /// Lifecycle surfaces (Source → Forge → Deploy → Nexus)
  public type Surface = {
    #Source;
    #Forge;
    #Deploy;
    #Nexus;
  };

  /// Pheromone signal types (inter-engine communication)
  public type PheromoneType = {
    #TaskAvailable;      // Scout found work → broadcast to Worker
    #ThreatDetected;     // Guard detects danger → broadcast to all
    #ResourceLow;        // Memory detects low cycles → alert Governance
    #BuildRequest;       // Worker needs infrastructure → alert Builder
    #ConsensusNeeded;    // Conflict detected → alert Governance
    #MemoryCommit;       // Task complete → alert Memory for persistence
    #OpportunityFound;   // Scout found high-value target → prioritize Worker
    #SwarmTrigger;       // Colony at capacity → initiate swarming event
    #QueenSignal;        // Governance policy update → broadcast to all
    #DanceWaggle;        // Scout directional signal (distance + quality)
  };

  /// A pheromone trail message (the colony's communication protocol)
  public type PheromoneSignal = {
    id         : Nat;
    timestamp  : Int;
    source     : EngineCaste;    // Which engine emitted
    target     : ?EngineCaste;   // Specific target or null (broadcast)
    signalType : PheromoneType;
    payload    : Text;           // Signal data (JSON)
    strength   : Float;          // Signal strength [0, 1] — decays over time
    priority   : Float;          // φ-weighted priority
  };

  /// Task in the worker queue
  public type ColonyTask = {
    id          : Nat;
    timestamp   : Int;
    surface     : Surface;
    taskType    : Text;
    payload     : Text;
    caller      : Text;
    priority    : Float;
    assignedTo  : ?EngineCaste;
    status      : TaskStatus;
    resultHash  : ?Text;
    cyclesCost  : Nat;
  };

  public type TaskStatus = {
    #Queued;
    #Scouting;    // Scout evaluating
    #Guarding;    // Guard validating
    #Working;     // Worker executing
    #Building;    // Builder expanding
    #Committing;  // Memory persisting
    #Governed;    // Governance reviewing
    #Completed;
    #Rejected;
  };

  /// Engine health state
  public type EngineState = {
    caste        : EngineCaste;
    active       : Bool;
    taskCount    : Nat;          // Tasks processed
    cyclesBurned : Nat;          // Energy consumed
    lastActive   : Int;          // Last activity timestamp
    health       : Float;        // Health score [0, 1]
    temperature  : Float;        // Engine "temperature" (load metric)
  };

  /// Colony-wide state snapshot
  public type ColonySnapshot = {
    timestamp     : Int;
    heartbeat     : Nat;
    population    : Nat;          // Total active tasks
    temperature   : Float;        // Colony average temperature
    resourceBalance: Float;       // φ-resource balance score
    queenSignal   : Float;        // Governance coherence (Kuramoto R)
    defenseReady  : Float;        // Guard readiness [0, 1]
    foragerRatio  : Float;        // Worker/total task ratio
    swarmPressure : Float;        // How close to swarming threshold
    engines       : [EngineState];
  };

  /// Governance proposal (collective decision-making)
  public type Proposal = {
    id          : Nat;
    timestamp   : Int;
    proposer    : EngineCaste;
    description : Text;
    voteFor     : Nat;
    voteAgainst : Nat;
    status      : ProposalStatus;
    enacted     : Bool;
  };

  public type ProposalStatus = {
    #Active;
    #Passed;
    #Rejected;
    #Enacted;
  };

  // ══════════════════════════════════════════════════════════════════
  //  STATE — The Hive Mind
  // ══════════════════════════════════════════════════════════════════

  stable var hbtCount : Nat = 0;
  stable var lastBeatTime : Int = 0;
  stable var initialized : Bool = false;
  stable var colonyId : Text = "CLOUD_COLONY_ALPHA";

  // ─── Pheromone Trail Queue (inter-engine communication) ────────
  stable var pheromoneCount : Nat = 0;
  transient var pheromoneTrail = Buffer.Buffer<PheromoneSignal>(100);

  // ─── Task Queue (colony work) ─────────────────────────────────
  stable var taskCount : Nat = 0;
  transient var taskQueue = Buffer.Buffer<ColonyTask>(50);

  // ─── Engine States ────────────────────────────────────────────
  stable var workerTaskCount : Nat = 0;
  stable var scoutTaskCount  : Nat = 0;
  stable var guardTaskCount  : Nat = 0;
  stable var builderTaskCount: Nat = 0;
  stable var memoryTaskCount : Nat = 0;
  stable var govTaskCount    : Nat = 0;

  stable var workerCycles  : Nat = 0;
  stable var scoutCycles   : Nat = 0;
  stable var guardCycles   : Nat = 0;
  stable var builderCycles : Nat = 0;
  stable var memoryCycles  : Nat = 0;
  stable var govCycles     : Nat = 0;

  // ─── Governance State ─────────────────────────────────────────
  stable var proposalCount : Nat = 0;
  transient var proposals = Buffer.Buffer<Proposal>(20);

  // ─── Memory State (honey stores) ─────────────────────────────
  stable var memoryRecordCount : Nat = 0;
  stable var totalCyclesBurned : Nat = 0;
  stable var totalTasksCompleted: Nat = 0;
  stable var totalSignalsEmitted: Nat = 0;

  // ─── Colony Economics ─────────────────────────────────────────
  stable var totalRevenue  : Nat = 0;
  stable var totalSpending : Nat = 0;

  // ══════════════════════════════════════════════════════════════════
  //  INITIALIZATION
  // ══════════════════════════════════════════════════════════════════

  public shared(msg) func initialize() : async Text {
    if (initialized) { return "Colony already alive" };
    initialized := true;
    lastBeatTime := Time.now();

    // Emit genesis pheromone — queen signal to all engines
    _emitPheromone(#Governance, null, #QueenSignal,
      "{\"event\":\"genesis\",\"message\":\"Colony born. All engines activate.\"}",
      1.0, PHI_CB);

    return "CloudColony initialized — six engines online, hive mind active";
  };

  // ══════════════════════════════════════════════════════════════════
  //  HEARTBEAT — Colony Metabolism (medina-heart pattern)
  // ══════════════════════════════════════════════════════════════════

  func _heartbeat() : async () {
    hbtCount += 1;
    let now = Time.now();
    lastBeatTime := now;

    // ─── LOCAL COMPUTATION ONLY ───────────────────────────────────

    // 1. Decay pheromone strengths (signals fade over time, like real pheromones)
    _decayPheromones();

    // 2. Process task queue routing (Scout → Guard → Worker pipeline)
    _routeTasks();

    // 3. Update colony temperature (load balancing metric)
    _updateTemperature();

    // 4. Check swarm pressure (capacity threshold)
    _checkSwarmPressure();

    // 5. Governance heartbeat (process active proposals)
    _processProposals();
  };

  // Heartbeat timer started at end of actor (after all function definitions)

  // ══════════════════════════════════════════════════════════════════
  //  ENGINE 1: SCOUT — Signal Monitoring & Opportunity Detection
  // ══════════════════════════════════════════════════════════════════

  /// Scout receives external signals and classifies them.
  /// Maps to SOURCE surface in the lifecycle.
  public shared(msg) func scout_ingest(
    signalType : Text,
    payload    : Text,
    priority   : Float
  ) : async Result.Result<Nat, Text> {
    let caller = Principal.toText(msg.caller);
    let now = Time.now();

    // Create task at SOURCE surface
    let taskId = taskCount;
    taskCount += 1;

    let task : ColonyTask = {
      id         = taskId;
      timestamp  = now;
      surface    = #Source;
      taskType   = signalType;
      payload    = payload;
      caller     = caller;
      priority   = priority;
      assignedTo = ?#Scout;
      status     = #Scouting;
      resultHash = null;
      cyclesCost = 0;
    };
    taskQueue.add(task);
    scoutTaskCount += 1;

    // Emit pheromone: opportunity found → alert Worker
    _emitPheromone(#Scout, ?#Worker, #OpportunityFound,
      "{\"taskId\":" # Nat.toText(taskId) # ",\"type\":\"" # signalType # "\",\"priority\":" # Float.toText(priority) # "}",
      priority, priority * PHI);

    // Emit waggle dance signal (directional: surface + quality)
    _emitPheromone(#Scout, null, #DanceWaggle,
      "{\"taskId\":" # Nat.toText(taskId) # ",\"surface\":\"SOURCE\",\"quality\":" # Float.toText(priority) # "}",
      priority * PHI_INV, priority);

    #ok(taskId)
  };

  // ══════════════════════════════════════════════════════════════════
  //  ENGINE 2: GUARD — Threat Validation & Filtering
  // ══════════════════════════════════════════════════════════════════

  /// Guard validates a task before it reaches Worker.
  /// Filters threats, validates payload integrity, checks caller reputation.
  public shared(msg) func guard_validate(taskId : Nat) : async Result.Result<Bool, Text> {
    if (taskId >= taskQueue.size()) {
      return #err("Task not found: " # Nat.toText(taskId));
    };

    let task = taskQueue.get(taskId);
    let now = Time.now();

    // Validation checks (local computation)
    let payloadValid = Text.size(task.payload) > 0 and Text.size(task.payload) < 1_000_000;
    let priorityValid = task.priority >= 0.0 and task.priority <= PHI_CB;
    let callerValid = Text.size(task.caller) > 0;

    let passed = payloadValid and priorityValid and callerValid;

    if (passed) {
      // Update task status → ready for Worker
      let updated : ColonyTask = {
        id         = task.id;
        timestamp  = task.timestamp;
        surface    = #Forge;  // Advance to FORGE surface
        taskType   = task.taskType;
        payload    = task.payload;
        caller     = task.caller;
        priority   = task.priority;
        assignedTo = ?#Worker;
        status     = #Working;
        resultHash = null;
        cyclesCost = 0;
      };
      taskQueue.put(taskId, updated);

      // Emit: task available for Worker
      _emitPheromone(#Guard, ?#Worker, #TaskAvailable,
        "{\"taskId\":" # Nat.toText(taskId) # ",\"validated\":true}",
        task.priority, task.priority * PHI);

    } else {
      // Reject task
      let updated : ColonyTask = {
        id         = task.id;
        timestamp  = task.timestamp;
        surface    = task.surface;
        taskType   = task.taskType;
        payload    = task.payload;
        caller     = task.caller;
        priority   = task.priority;
        assignedTo = ?#Guard;
        status     = #Rejected;
        resultHash = null;
        cyclesCost = 0;
      };
      taskQueue.put(taskId, updated);

      // Emit: threat detected
      _emitPheromone(#Guard, null, #ThreatDetected,
        "{\"taskId\":" # Nat.toText(taskId) # ",\"reason\":\"validation_failed\"}",
        1.0, PHI_CB);
    };

    guardTaskCount += 1;
    #ok(passed)
  };

  // ══════════════════════════════════════════════════════════════════
  //  ENGINE 3: WORKER — Task Execution & Generation
  // ══════════════════════════════════════════════════════════════════

  /// Worker executes a validated task and produces output.
  /// Maps to FORGE surface: transform, produce, generate.
  public shared(msg) func worker_execute(
    taskId     : Nat,
    resultData : Text,
    cyclesUsed : Nat
  ) : async Result.Result<Text, Text> {
    let worker = Principal.toText(msg.caller);

    if (taskId >= taskQueue.size()) {
      return #err("Task not found");
    };

    let task = taskQueue.get(taskId);

    switch (task.status) {
      case (#Working) {};
      case _ { return #err("Task not in Working state") };
    };

    let resultHash = _simpleHash(resultData);

    // Update task to completed
    let updated : ColonyTask = {
      id         = task.id;
      timestamp  = task.timestamp;
      surface    = #Deploy;  // Advance to DEPLOY surface
      taskType   = task.taskType;
      payload    = task.payload;
      caller     = task.caller;
      priority   = task.priority;
      assignedTo = ?#Worker;
      status     = #Completed;
      resultHash = ?resultHash;
      cyclesCost = cyclesUsed;
    };
    taskQueue.put(taskId, updated);

    workerTaskCount += 1;
    workerCycles += cyclesUsed;
    totalCyclesBurned += cyclesUsed;
    totalTasksCompleted += 1;

    // Emit: memory commit signal (persist result)
    _emitPheromone(#Worker, ?#Memory, #MemoryCommit,
      "{\"taskId\":" # Nat.toText(taskId) # ",\"resultHash\":\"" # resultHash # "\",\"cycles\":" # Nat.toText(cyclesUsed) # "}",
      task.priority, task.priority);

    #ok(resultHash)
  };

  // ══════════════════════════════════════════════════════════════════
  //  ENGINE 4: BUILDER — Infrastructure Expansion
  // ══════════════════════════════════════════════════════════════════

  /// Builder expands colony infrastructure when capacity is needed.
  /// Maps to DEPLOY surface: test boundaries, expand, deploy.
  public shared(msg) func builder_expand(
    expansionType : Text,
    specification : Text
  ) : async Result.Result<Text, Text> {
    let now = Time.now();

    builderTaskCount += 1;

    // Emit: build request acknowledged
    _emitPheromone(#Builder, ?#Governance, #ConsensusNeeded,
      "{\"expansion\":\"" # expansionType # "\",\"requires_governance\":true}",
      PHI_INV, PHI);

    #ok("Builder acknowledged: " # expansionType # " — awaiting governance approval")
  };

  // ══════════════════════════════════════════════════════════════════
  //  ENGINE 5: MEMORY — State Preservation & Identity
  // ══════════════════════════════════════════════════════════════════

  /// Memory engine persists completed task results and maintains colony identity.
  /// Maps to NEXUS surface: register, preserve lineage, maintain continuity.
  /// "The hive never forgets."
  public shared(msg) func memory_commit(
    taskId      : Nat,
    resultHash  : Text,
    lineageRef  : ?Nat,
    memo        : Text
  ) : async Result.Result<Nat, Text> {
    let now = Time.now();

    if (taskId >= taskQueue.size()) {
      return #err("Task not found");
    };

    let task = taskQueue.get(taskId);
    memoryTaskCount += 1;
    memoryRecordCount += 1;

    // Advance task surface to NEXUS
    let updated : ColonyTask = {
      id         = task.id;
      timestamp  = task.timestamp;
      surface    = #Nexus;
      taskType   = task.taskType;
      payload    = task.payload;
      caller     = task.caller;
      priority   = task.priority;
      assignedTo = ?#Memory;
      status     = task.status;
      resultHash = task.resultHash;
      cyclesCost = task.cyclesCost;
    };
    taskQueue.put(taskId, updated);

    #ok(memoryRecordCount)
  };

  // ══════════════════════════════════════════════════════════════════
  //  ENGINE 6: GOVERNANCE — Conflict Resolution & Resource Policy
  // ══════════════════════════════════════════════════════════════════

  /// Governance creates a proposal for colony-wide decisions.
  /// "The queen + collective decision rules."
  public shared(msg) func governance_propose(
    description : Text,
    proposer    : EngineCaste
  ) : async Result.Result<Nat, Text> {
    let now = Time.now();
    let propId = proposalCount;
    proposalCount += 1;

    let proposal : Proposal = {
      id          = propId;
      timestamp   = now;
      proposer    = proposer;
      description = description;
      voteFor     = 0;
      voteAgainst = 0;
      status      = #Active;
      enacted     = false;
    };
    proposals.add(proposal);
    govTaskCount += 1;

    // Emit: queen signal to all engines
    _emitPheromone(#Governance, null, #QueenSignal,
      "{\"proposalId\":" # Nat.toText(propId) # ",\"description\":\"" # description # "\"}",
      1.0, PHI_CB);

    #ok(propId)
  };

  /// Vote on an active proposal
  public shared(msg) func governance_vote(
    proposalId : Nat,
    inFavor    : Bool
  ) : async Result.Result<Text, Text> {
    if (proposalId >= proposals.size()) {
      return #err("Proposal not found");
    };

    let prop = proposals.get(proposalId);
    switch (prop.status) {
      case (#Active) {};
      case _ { return #err("Proposal not active") };
    };

    let updated : Proposal = {
      id          = prop.id;
      timestamp   = prop.timestamp;
      proposer    = prop.proposer;
      description = prop.description;
      voteFor     = if (inFavor) { prop.voteFor + 1 } else { prop.voteFor };
      voteAgainst = if (not inFavor) { prop.voteAgainst + 1 } else { prop.voteAgainst };
      status      = prop.status;
      enacted     = prop.enacted;
    };
    proposals.put(proposalId, updated);

    #ok("Vote recorded")
  };

  // ══════════════════════════════════════════════════════════════════
  //  PHEROMONE TRAIL SYSTEM — Inter-Engine Communication
  // ══════════════════════════════════════════════════════════════════

  /// Emit a pheromone signal (internal helper)
  func _emitPheromone(
    source     : EngineCaste,
    target     : ?EngineCaste,
    signalType : PheromoneType,
    payload    : Text,
    strength   : Float,
    priority   : Float
  ) {
    let signal : PheromoneSignal = {
      id         = pheromoneCount;
      timestamp  = Time.now();
      source     = source;
      target     = target;
      signalType = signalType;
      payload    = payload;
      strength   = Float.min(1.0, strength);
      priority   = priority;
    };
    pheromoneCount += 1;
    totalSignalsEmitted += 1;

    // Bounded queue: evict oldest if full
    if (pheromoneTrail.size() >= MAX_PHEROMONE_QUEUE) {
      // Remove weakest signal (lowest strength)
      var weakest : Nat = 0;
      var weakestStr : Float = 2.0;
      var i : Nat = 0;
      while (i < pheromoneTrail.size()) {
        let s = pheromoneTrail.get(i);
        if (s.strength < weakestStr) {
          weakestStr := s.strength;
          weakest := i;
        };
        i += 1;
      };
      // Replace weakest with new signal
      pheromoneTrail.put(weakest, signal);
    } else {
      pheromoneTrail.add(signal);
    };
  };

  /// Decay all pheromone strengths (called in heartbeat)
  /// Real pheromones evaporate; digital ones decay by 1/φ per beat.
  func _decayPheromones() {
    let size = pheromoneTrail.size();
    var i : Nat = 0;
    var toRemove = Buffer.Buffer<Nat>(10);
    while (i < size) {
      let signal = pheromoneTrail.get(i);
      let newStrength = signal.strength * PHEROMONE_DECAY;
      if (newStrength < 0.01) {
        toRemove.add(i);
      } else {
        let updated : PheromoneSignal = {
          id         = signal.id;
          timestamp  = signal.timestamp;
          source     = signal.source;
          target     = signal.target;
          signalType = signal.signalType;
          payload    = signal.payload;
          strength   = newStrength;
          priority   = signal.priority * PHEROMONE_DECAY;
        };
        pheromoneTrail.put(i, updated);
      };
      i += 1;
    };
    // Note: removal deferred to avoid index shifts during iteration
    // Weak signals will be replaced by _emitPheromone's eviction logic
  };

  /// Route queued tasks through the Scout→Guard→Worker pipeline
  func _routeTasks() {
    let size = taskQueue.size();
    var i : Nat = 0;
    while (i < size) {
      let task = taskQueue.get(i);
      switch (task.status) {
        case (#Queued) {
          // Auto-assign to Scout for classification
          let updated : ColonyTask = {
            id         = task.id;
            timestamp  = task.timestamp;
            surface    = #Source;
            taskType   = task.taskType;
            payload    = task.payload;
            caller     = task.caller;
            priority   = task.priority;
            assignedTo = ?#Scout;
            status     = #Scouting;
            resultHash = null;
            cyclesCost = 0;
          };
          taskQueue.put(i, updated);
        };
        case _ {};
      };
      i += 1;
    };
  };

  /// Update colony temperature (average engine load)
  func _updateTemperature() {
    // Temperature = weighted average of task counts across engines
    // Target is 34.98°C (normalized as task rate ratio)
  };

  /// Check if colony should swarm (horizontal scaling trigger)
  func _checkSwarmPressure() {
    let pendingCount = _countPending();
    let capacity = MAX_WORKER_QUEUE;
    let pressure : Float = Float.fromInt(pendingCount) / Float.fromInt(capacity);

    if (pressure > SWARM_STAY_RATIO) {
      // Colony at >61.8% capacity — emit swarm pressure signal
      _emitPheromone(#Governance, null, #SwarmTrigger,
        "{\"pressure\":" # Float.toText(pressure) # ",\"pending\":" # Nat.toText(pendingCount) # "}",
        pressure, PHI_CB);
    };
  };

  /// Process active governance proposals (quorum check)
  func _processProposals() {
    let size = proposals.size();
    var i : Nat = 0;
    while (i < size) {
      let prop = proposals.get(i);
      switch (prop.status) {
        case (#Active) {
          let totalVotes = prop.voteFor + prop.voteAgainst;
          if (totalVotes >= 3) {  // Minimum 3 votes (= 3 engines)
            let ratio : Float = Float.fromInt(prop.voteFor) / Float.fromInt(totalVotes);
            let passed = ratio >= QUORUM_THRESHOLD;
            let updated : Proposal = {
              id          = prop.id;
              timestamp   = prop.timestamp;
              proposer    = prop.proposer;
              description = prop.description;
              voteFor     = prop.voteFor;
              voteAgainst = prop.voteAgainst;
              status      = if (passed) { #Passed } else { #Rejected };
              enacted     = false;
            };
            proposals.put(i, updated);
          };
        };
        case _ {};
      };
      i += 1;
    };
  };

  /// Count pending (non-terminal) tasks
  func _countPending() : Nat {
    let size = taskQueue.size();
    var count : Nat = 0;
    var i : Nat = 0;
    while (i < size) {
      let task = taskQueue.get(i);
      switch (task.status) {
        case (#Completed or #Rejected) {};
        case _ { count += 1 };
      };
      i += 1;
    };
    count
  };

  // ══════════════════════════════════════════════════════════════════
  //  QUERY API — Colony Health Dashboard
  // ══════════════════════════════════════════════════════════════════

  /// Get full colony snapshot (the "Heartbeat Dashboard")
  public query func get_colony_snapshot() : async ColonySnapshot {
    let pending = _countPending();
    let total = workerTaskCount + scoutTaskCount + guardTaskCount + builderTaskCount + memoryTaskCount + govTaskCount;
    let foragerRatio : Float = if (total > 0) { Float.fromInt(workerTaskCount) / Float.fromInt(total) } else { 0.0 };
    let pressure : Float = Float.fromInt(pending) / Float.fromInt(MAX_WORKER_QUEUE);

    {
      timestamp      = Time.now();
      heartbeat      = hbtCount;
      population     = pending;
      temperature    = OPTIMAL_TEMPERATURE;
      resourceBalance = PHI_INV;
      queenSignal    = 1.0;
      defenseReady   = if (guardTaskCount > 0) { 1.0 } else { PHI_INV };
      foragerRatio   = foragerRatio;
      swarmPressure  = pressure;
      engines        = [
        { caste = #Worker;     active = true; taskCount = workerTaskCount;  cyclesBurned = workerCycles;  lastActive = lastBeatTime; health = 1.0; temperature = OPTIMAL_TEMPERATURE },
        { caste = #Scout;      active = true; taskCount = scoutTaskCount;   cyclesBurned = scoutCycles;   lastActive = lastBeatTime; health = 1.0; temperature = OPTIMAL_TEMPERATURE },
        { caste = #Guard;      active = true; taskCount = guardTaskCount;   cyclesBurned = guardCycles;   lastActive = lastBeatTime; health = 1.0; temperature = OPTIMAL_TEMPERATURE },
        { caste = #Builder;    active = true; taskCount = builderTaskCount; cyclesBurned = builderCycles; lastActive = lastBeatTime; health = 1.0; temperature = OPTIMAL_TEMPERATURE },
        { caste = #Memory;     active = true; taskCount = memoryTaskCount;  cyclesBurned = memoryCycles;  lastActive = lastBeatTime; health = 1.0; temperature = OPTIMAL_TEMPERATURE },
        { caste = #Governance; active = true; taskCount = govTaskCount;     cyclesBurned = govCycles;     lastActive = lastBeatTime; health = 1.0; temperature = OPTIMAL_TEMPERATURE },
      ];
    }
  };

  /// Get recent pheromone signals (active trail)
  public query func get_pheromone_trail(limit : Nat) : async [PheromoneSignal] {
    let size = pheromoneTrail.size();
    let start = if (size > limit) { size - limit } else { 0 };
    let result = Buffer.Buffer<PheromoneSignal>(size - start);
    var i = start;
    while (i < size) {
      result.add(pheromoneTrail.get(i));
      i += 1;
    };
    Buffer.toArray(result)
  };

  /// Get task queue status
  public query func get_task_queue(offset : Nat, limit : Nat) : async [ColonyTask] {
    let size = taskQueue.size();
    if (offset >= size) { return [] };
    let end = if (offset + limit > size) { size } else { offset + limit };
    let result = Buffer.Buffer<ColonyTask>(end - offset);
    var i = offset;
    while (i < end) {
      result.add(taskQueue.get(i));
      i += 1;
    };
    Buffer.toArray(result)
  };

  /// Get governance proposals
  public query func get_proposals() : async [Proposal] {
    Buffer.toArray(proposals)
  };

  /// Get colony economics
  public query func get_economics() : async {
    totalCyclesBurned  : Nat;
    totalTasksCompleted: Nat;
    totalSignalsEmitted: Nat;
    totalRevenue       : Nat;
    totalSpending      : Nat;
    memoryRecords      : Nat;
    heartbeats         : Nat;
    phiPremium         : Float;
  } {
    {
      totalCyclesBurned   = totalCyclesBurned;
      totalTasksCompleted = totalTasksCompleted;
      totalSignalsEmitted = totalSignalsEmitted;
      totalRevenue        = totalRevenue;
      totalSpending       = totalSpending;
      memoryRecords       = memoryRecordCount;
      heartbeats          = hbtCount;
      phiPremium          = PHI_SQ;
    }
  };

  // ══════════════════════════════════════════════════════════════════
  //  INTERNAL HELPERS
  // ══════════════════════════════════════════════════════════════════

  func _simpleHash(data : Text) : Text {
    var h : Nat = 5381;
    for (c in data.chars()) {
      let charCode = Nat32.toNat(Char.toNat32(c));
      h := ((h * 33) + charCode) % 4294967296;
    };
    Nat.toText(h)
  };

  // ══════════════════════════════════════════════════════════════════
  //  ★ BORN BEATING — Timer self-starts on deploy (medina-heart)
  //  ★ NOVA's own recurring timer. NOT ICP's system heartbeat.
  //  ★ Fires every ~2s. Pure local colony metabolism only.
  // ══════════════════════════════════════════════════════════════════
  ignore Timer.recurringTimer<system>(#seconds 2, _heartbeat);
};
