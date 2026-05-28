///
/// ALPHA ORCHESTRATOR — The Sovereign Directive Router
///
/// "One voice issues the directive. The orchestra moves as one."
///
/// The Alpha Orchestrator is the supreme coordination layer for all Alpha-tier
/// agents (THESIS, Codex Phantasmatis, CIVOS-PRIME, AURO, ORIGO). It receives
/// high-level directives, decomposes them into routable tasks, assigns them to
/// the appropriate Alpha agent based on capability matching and φ-weighted
/// priority, and tracks execution across the entire Alpha division.
///
/// THIS ORGANISM IS ALIVE:
///   - system func heartbeat() fires every ~2 seconds
///   - Genesis sequence: claimGenesis → bootstrap → LIVE
///   - Auto-registers into NEXORIS mesh on first heartbeat
///   - Auto-registers into TURING organism model
///   - Inter-canister wiring to Alpha Conductor for timing
///   - Autonomous directive processing in heartbeat loop
///   - Self-healing: retries failed tasks every φ×T epochs
///
/// Sub-models hosted:
///   DIRECTIVE  — Intake and decomposition of sovereign directives
///   DISPATCH   — φ-weighted routing to Alpha agents
///   LIFECYCLE  — Multi-step workflow tracking and completion
///   QUORUM     — Consensus gathering across Alpha agents
///
/// Casa de Medina — Architectos de Architectura Inteligente
///

import Float  "mo:base/Float";
import Int    "mo:base/Int";
import Nat    "mo:base/Nat";
import Text   "mo:base/Text";
import Buffer "mo:base/Buffer";
import Time   "mo:base/Time";
import Iter   "mo:base/Iter";
import Array  "mo:base/Array";
import Principal "mo:base/Principal";
import Result "mo:base/Result";

persistent actor AlphaOrchestrator {

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
  //  INTER-CANISTER WIRING — The Nervous System
  // ══════════════════════════════════════════════════════════════════

  /// NEXORIS mesh (lives in nexus canister)
  type NexorisActor = actor {
    registerOrganism : (Text, Text, [Text]) -> async Text;
    wire : (Text, Text, Text) -> async {
      id : Nat; fromOrg : Text; toOrg : Text;
      capability : Text; wiredAt : Int; active : Bool;
    };
  };

  /// TURING solver (organism registry)
  type TuringActor = actor {
    registerOrganism : (Text, Text, [Text]) -> async Text;
  };

  /// Alpha Conductor (timing/sync partner)
  type ConductorActor = actor {
    joinEnsemble : (Text, Float, Float) -> async {
      name : Text; phase : Float; naturalFreq : Float;
      coupling : Float; lastBeat : Int; active : Bool;
    };
    beat : () -> async {
      measure : Nat; beat : Nat; tempo : Float;
      coherence : Float; timestamp : Int;
    };
  };

  stable var nexusCanisterId     : ?Principal = null;
  stable var turingCanisterId    : ?Principal = null;
  stable var conductorCanisterId : ?Principal = null;

  public shared(msg) func setNexus(canisterId : Principal) : async () {
    nexusCanisterId := ?canisterId;
  };

  public shared(msg) func setTuring(canisterId : Principal) : async () {
    turingCanisterId := ?canisterId;
  };

  public shared(msg) func setConductor(canisterId : Principal) : async () {
    conductorCanisterId := ?canisterId;
  };

  func getNexoris() : ?NexorisActor {
    switch (nexusCanisterId) {
      case null null;
      case (?id) ?( actor (Principal.toText(id)) : NexorisActor );
    }
  };

  func getTuring() : ?TuringActor {
    switch (turingCanisterId) {
      case null null;
      case (?id) ?( actor (Principal.toText(id)) : TuringActor );
    }
  };

  func getConductor() : ?ConductorActor {
    switch (conductorCanisterId) {
      case null null;
      case (?id) ?( actor (Principal.toText(id)) : ConductorActor );
    }
  };

  // ══════════════════════════════════════════════════════════════════
  //  CONSTANTS — The Golden Mathematics
  // ══════════════════════════════════════════════════════════════════

  transient let PHI : Float = 1.6180339887498948482;
  transient let PHI_INV : Float = 0.6180339887498948482;
  transient let LOV : Float = 2.1784575679504797; // φ^φ

  /// Heartbeat interval for autonomous processing (~5 min = 150 ticks)
  transient let HBT_PROCESS_INTERVAL : Nat = 150;
  /// Heartbeat interval for diagnostics (~30 min = 900 ticks)
  transient let HBT_DIAG_INTERVAL : Nat = 900;
  /// Heartbeat interval for self-healing (~2 hours = 3600 ticks)
  transient let HBT_HEAL_INTERVAL : Nat = 3600;
  /// Max diag log entries
  transient let MAX_DIAG : Nat = 64;

  // ══════════════════════════════════════════════════════════════════
  //  GENESIS — The Birth Sequence
  // ══════════════════════════════════════════════════════════════════

  stable var sovereign    : Text = "";
  stable var initialized  : Bool = false;
  stable var registeredInMesh : Bool = false;
  stable var heartbeatCount : Nat = 0;

  /// Lock the caller as sovereign controller. First step of genesis.
  public shared(msg) func claimGenesis() : async Text {
    if (sovereign != "") {
      return "Genesis already claimed by: " # sovereign;
    };
    sovereign := Principal.toText(msg.caller);
    auditLog.add("Genesis claimed by " # sovereign # " at " # Int.toText(Time.now()));
    "Genesis claimed. Sovereign: " # sovereign
  };

  /// Bootstrap the orchestrator into life. Seeds the Alpha agent registry
  /// and activates the autonomous heartbeat loop.
  public shared(msg) func bootstrap() : async Text {
    if (initialized) { return "Already alive. Sovereign: " # sovereign };
    if (sovereign == "") { return "Error: call claimGenesis first" };
    if (Principal.toText(msg.caller) != sovereign) {
      return "Error: only sovereign can bootstrap"
    };

    // Seed the 5 Alpha agents into our internal registry
    _seedAlphaAgents();
    initialized := true;

    auditLog.add("ALPHA_ORCHESTRATOR bootstrapped. The orchestra is LIVE.");
    "Alpha Orchestrator is ALIVE. 5 Alpha agents registered. Heartbeat active. " #
    "Autonomous directive processing: ON."
  };

  /// Seed the 5 Alpha agents with their capabilities
  func _seedAlphaAgents() {
    let agents : [(AlphaAgentId, Text, [Text])] = [
      (#THESIS,            "THESIS Alpha",        ["research", "ip", "proof", "publication", "notarization"]),
      (#CodexPhantasmatis, "Codex Phantasmatis",  ["coding", "implementation", "architecture", "artifact"]),
      (#CIVOS_PRIME,       "CIVOS-PRIME",         ["governing", "law", "routing", "quorum", "consensus"]),
      (#AURO,              "AURO",                ["speaking", "voice", "bridge", "intelligence"]),
      (#ORIGO,             "ORIGO",               ["building", "architecture", "topology", "registry"]),
    ];

    for ((id, agentName, caps) in agents.vals()) {
      alphaAgents.add({
        id;
        name         = agentName;
        capabilities = caps;
        health       = 1.0;
        lastSeen     = Time.now();
        tasksCompleted = 0;
        tasksFailed    = 0;
        status       = #Active;
      });
    };
  };

  /// Auto-register into NEXORIS mesh and TURING. Called from heartbeat.
  func _autoRegister() : async () {
    // Register with NEXORIS
    switch (getNexoris()) {
      case null {};
      case (?nexoris) {
        ignore await nexoris.registerOrganism(
          "alpha_orchestrator",
          "gold",
          ["orchestration", "dispatch", "lifecycle", "quorum", "alpha_routing"]
        );
        // Wire to conductor
        ignore await nexoris.wire("alpha_orchestrator", "alpha_conductor", "sync");
        ignore await nexoris.wire("alpha_orchestrator", "turing", "solve");
      };
    };

    // Register with TURING
    switch (getTuring()) {
      case null {};
      case (?turing) {
        ignore await turing.registerOrganism(
          "alpha_orchestrator",
          "gold",
          ["orchestration", "dispatch", "lifecycle", "quorum", "alpha_routing"]
        );
      };
    };

    // Join the Conductor's ensemble
    switch (getConductor()) {
      case null {};
      case (?conductor) {
        ignore await conductor.joinEnsemble(
          "alpha_orchestrator",
          PHI,       // natural frequency = φ (golden cadence)
          PHI_INV    // coupling = φ⁻¹ (strong but not locked)
        );
      };
    };

    registeredInMesh := true;
    auditLog.add("Auto-registered in NEXORIS + TURING + Conductor ensemble");
  };

  // ══════════════════════════════════════════════════════════════════
  //  TYPES — The Vocabulary
  // ══════════════════════════════════════════════════════════════════

  /// Alpha Agent identifiers — the five sovereign Alpha agents
  public type AlphaAgentId = {
    #THESIS;            // AGT-041: Research · IP · Proof · Publication
    #CodexPhantasmatis; // AGT-042: Implementation execution
    #CIVOS_PRIME;       // AGT-043: Governing orchestration
    #AURO;              // AGT-044: Native speaking intelligence
    #ORIGO;             // AGT-045: Operating architecture
  };

  public type AlphaAgentStatus = { #Active; #Degraded; #Offline };

  /// Internal registry entry for an Alpha agent
  public type AlphaAgent = {
    id             : AlphaAgentId;
    name           : Text;
    capabilities   : [Text];
    health         : Float;
    lastSeen       : Int;
    tasksCompleted : Nat;
    tasksFailed    : Nat;
    status         : AlphaAgentStatus;
  };

  /// Priority tier for directives
  public type DirectivePriority = {
    #Sovereign;   // Highest — from governance organ
    #Strategic;   // Long-range planning
    #Operational; // Standard execution
    #Tactical;    // Immediate response
  };

  /// A directive — a high-level instruction to be decomposed and routed
  public type Directive = {
    id          : Nat;
    intent      : Text;
    priority    : DirectivePriority;
    source      : Principal;
    tasks       : [Nat];
    status      : DirectiveStatus;
    createdAt   : Int;
    completedAt : ?Int;
  };

  public type DirectiveStatus = {
    #Pending;
    #Decomposing;
    #InFlight;
    #Completed;
    #Failed;
    #Cancelled;
  };

  /// A task — a single routable unit of work assigned to an Alpha agent
  public type Task = {
    id           : Nat;
    directiveId  : Nat;
    description  : Text;
    assignedTo   : AlphaAgentId;
    weight       : Float;
    status       : TaskStatus;
    result       : ?Text;
    createdAt    : Int;
    completedAt  : ?Int;
    attempts     : Nat;
  };

  public type TaskStatus = {
    #Queued;
    #Dispatched;
    #Running;
    #Completed;
    #Failed;
    #Retrying;
  };

  /// Quorum request
  public type QuorumRequest = {
    id         : Nat;
    question   : Text;
    responses  : [(AlphaAgentId, Text, Float)];
    threshold  : Float;
    resolved   : Bool;
    resolution : ?Text;
    createdAt  : Int;
  };

  /// Diagnostic snapshot
  public type DiagSnapshot = {
    health         : Float;
    directives     : Nat;
    inFlight       : Nat;
    completed      : Nat;
    failed         : Nat;
    agentsActive   : Nat;
    coherence      : Float;
    timestamp      : Int;
  };

  // ══════════════════════════════════════════════════════════════════
  //  STATE — The Living Memory
  // ══════════════════════════════════════════════════════════════════

  stable var nextDirectiveId : Nat = 0;
  stable var nextTaskId      : Nat = 0;
  stable var nextQuorumId    : Nat = 0;
  stable var totalDispatched : Nat = 0;
  stable var totalCompleted  : Nat = 0;
  stable var totalFailed     : Nat = 0;
  stable var epochCount      : Nat = 0;
  stable var lastCoherence   : Float = 1.0;

  transient let alphaAgents = Buffer.Buffer<AlphaAgent>(8);
  transient let directives  = Buffer.Buffer<Directive>(64);
  transient let tasks       = Buffer.Buffer<Task>(256);
  transient let quorums     = Buffer.Buffer<QuorumRequest>(32);
  transient let auditLog    = Buffer.Buffer<Text>(512);
  transient let diagLog     = Buffer.Buffer<DiagSnapshot>(64);

  // ══════════════════════════════════════════════════════════════════
  //  HEARTBEAT — The Autonomous Pulse (~2 seconds)
  //
  //  This is what makes the organism ALIVE.  The IC fires this
  //  automatically every consensus round.  No external trigger needed.
  // ══════════════════════════════════════════════════════════════════

  system func heartbeat() : async () {
    heartbeatCount += 1;

    // Don't process until genesis is complete
    if (not initialized) { return };

    // Auto-register into mesh on first live heartbeat
    if (not registeredInMesh) {
      await _autoRegister();
    };

    // Every HBT_PROCESS_INTERVAL: process pending directives
    if (heartbeatCount % HBT_PROCESS_INTERVAL == 0) {
      _processQueue();
    };

    // Every HBT_DIAG_INTERVAL: run self-diagnostics
    if (heartbeatCount % HBT_DIAG_INTERVAL == 0) {
      let d = _runDiag();
      diagLog.add(d);
      while (diagLog.size() > MAX_DIAG) { ignore diagLog.remove(0) };
      epochCount += 1;
    };

    // Every HBT_HEAL_INTERVAL: self-heal
    if (heartbeatCount % HBT_HEAL_INTERVAL == 0) {
      _selfHeal();
    };
  };

  /// Autonomous directive processing — dispatches queued work
  func _processQueue() {
    for (i in Iter.range(0, directives.size() - 1)) {
      let d = directives.get(i);
      // Auto-dispatch directives that are decomposed but not yet in flight
      if (d.status == #Decomposing) {
        var dispatched : Nat = 0;
        for (j in Iter.range(0, tasks.size() - 1)) {
          let t = tasks.get(j);
          if (t.directiveId == d.id and t.status == #Queued) {
            tasks.put(j, {
              id = t.id; directiveId = t.directiveId;
              description = t.description; assignedTo = t.assignedTo;
              weight = t.weight; status = #Dispatched;
              result = t.result; createdAt = t.createdAt;
              completedAt = null; attempts = t.attempts + 1;
            });
            dispatched += 1;
            totalDispatched += 1;
          };
        };
        if (dispatched > 0) {
          directives.put(i, {
            id = d.id; intent = d.intent; priority = d.priority;
            source = d.source; tasks = d.tasks; status = #InFlight;
            createdAt = d.createdAt; completedAt = null;
          });
          auditLog.add("AUTO-DISPATCH directive #" # Nat.toText(d.id) #
                       " → " # Nat.toText(dispatched) # " tasks");
        };
      };
    };
  };

  /// Self-diagnostic — computes health from completion rates
  func _runDiag() : DiagSnapshot {
    var inFlight : Nat = 0;
    var completed : Nat = 0;
    var failed : Nat = 0;
    for (d in directives.vals()) {
      switch (d.status) {
        case (#InFlight)  { inFlight += 1 };
        case (#Completed) { completed += 1 };
        case (#Failed)    { failed += 1 };
        case _ {};
      };
    };

    var agentsActive : Nat = 0;
    for (a in alphaAgents.vals()) {
      if (a.status == #Active) { agentsActive += 1 };
    };

    let rate = if (totalDispatched == 0) 1.0
               else Float.fromInt(totalCompleted) / Float.fromInt(totalDispatched);
    lastCoherence := rate;

    {
      health       = rate;
      directives   = directives.size();
      inFlight;
      completed;
      failed;
      agentsActive;
      coherence    = rate;
      timestamp    = Time.now();
    }
  };

  /// Self-healing — retries failed tasks up to 3 attempts
  func _selfHeal() {
    var retried : Nat = 0;
    for (i in Iter.range(0, tasks.size() - 1)) {
      let t = tasks.get(i);
      if (t.status == #Failed and t.attempts < 3) {
        tasks.put(i, {
          id = t.id; directiveId = t.directiveId;
          description = t.description; assignedTo = t.assignedTo;
          weight = t.weight; status = #Queued;
          result = null; createdAt = t.createdAt;
          completedAt = null; attempts = t.attempts;
        });
        retried += 1;
      };
    };
    if (retried > 0) {
      auditLog.add("SELF-HEAL: " # Nat.toText(retried) # " tasks re-queued (heartbeat " #
                   Nat.toText(heartbeatCount) # ")");
    };
  };

  // ══════════════════════════════════════════════════════════════════
  //  SUB-MODEL: DIRECTIVE — Intake & Decomposition
  // ══════════════════════════════════════════════════════════════════

  /// Submit a new directive to the Alpha Orchestrator.
  public shared(msg) func submitDirective(
    intent   : Text,
    priority : DirectivePriority
  ) : async Directive {
    let id = nextDirectiveId;
    nextDirectiveId += 1;

    let directive : Directive = {
      id; intent; priority;
      source      = msg.caller;
      tasks       = [];
      status      = #Pending;
      createdAt   = Time.now();
      completedAt = null;
    };

    directives.add(directive);
    auditLog.add("DIRECTIVE #" # Nat.toText(id) # " submitted: " # intent);
    directive
  };

  /// Decompose a directive into tasks and assign to Alpha agents.
  /// Uses φ-weighted capability matching.
  public func decomposeDirective(
    directiveId : Nat,
    taskSpecs   : [(Text, AlphaAgentId)]
  ) : async [Task] {
    let createdTasks = Buffer.Buffer<Task>(taskSpecs.size());
    let taskIds = Buffer.Buffer<Nat>(taskSpecs.size());

    var index : Nat = 0;
    for ((desc, agent) in taskSpecs.vals()) {
      let taskId = nextTaskId;
      nextTaskId += 1;

      let weight = Float.pow(PHI, -1.0 * Float.fromInt(index));

      let task : Task = {
        id          = taskId;
        directiveId;
        description = desc;
        assignedTo  = agent;
        weight;
        status      = #Queued;
        result      = null;
        createdAt   = Time.now();
        completedAt = null;
        attempts    = 0;
      };

      tasks.add(task);
      createdTasks.add(task);
      taskIds.add(taskId);
      index += 1;
    };

    // Update directive status
    for (i in Iter.range(0, directives.size() - 1)) {
      let d = directives.get(i);
      if (d.id == directiveId) {
        directives.put(i, {
          id = d.id; intent = d.intent; priority = d.priority;
          source = d.source; tasks = Buffer.toArray(taskIds);
          status = #Decomposing; createdAt = d.createdAt; completedAt = null;
        });
      };
    };

    auditLog.add("DECOMPOSE #" # Nat.toText(directiveId) #
                 " → " # Nat.toText(taskSpecs.size()) # " tasks");
    Buffer.toArray(createdTasks)
  };

  /// Auto-decompose: submit + decompose + route in one call.
  /// This is what TURING calls when it has a full plan.
  public shared(msg) func executeDirective(
    intent    : Text,
    priority  : DirectivePriority,
    taskSpecs : [(Text, AlphaAgentId)]
  ) : async { directiveId : Nat; tasksCreated : Nat } {
    let id = nextDirectiveId;
    nextDirectiveId += 1;

    let taskIds = Buffer.Buffer<Nat>(taskSpecs.size());
    var index : Nat = 0;

    for ((desc, agent) in taskSpecs.vals()) {
      let taskId = nextTaskId;
      nextTaskId += 1;
      let weight = Float.pow(PHI, -1.0 * Float.fromInt(index));

      tasks.add({
        id = taskId; directiveId = id;
        description = desc; assignedTo = agent;
        weight; status = #Queued;
        result = null; createdAt = Time.now();
        completedAt = null; attempts = 0;
      });
      taskIds.add(taskId);
      index += 1;
    };

    directives.add({
      id; intent; priority;
      source = msg.caller;
      tasks = Buffer.toArray(taskIds);
      status = #Decomposing;
      createdAt = Time.now();
      completedAt = null;
    });

    auditLog.add("EXECUTE directive #" # Nat.toText(id) # ": " # intent #
                 " → " # Nat.toText(taskSpecs.size()) # " tasks queued");
    { directiveId = id; tasksCreated = taskSpecs.size() }
  };

  // ══════════════════════════════════════════════════════════════════
  //  SUB-MODEL: DISPATCH — Manual override (heartbeat auto-dispatches)
  // ══════════════════════════════════════════════════════════════════

  /// Force-dispatch all queued tasks for a directive NOW.
  public func dispatchDirective(directiveId : Nat) : async Nat {
    var dispatched : Nat = 0;
    for (i in Iter.range(0, tasks.size() - 1)) {
      let t = tasks.get(i);
      if (t.directiveId == directiveId and t.status == #Queued) {
        tasks.put(i, {
          id = t.id; directiveId = t.directiveId;
          description = t.description; assignedTo = t.assignedTo;
          weight = t.weight; status = #Dispatched;
          result = t.result; createdAt = t.createdAt;
          completedAt = null; attempts = t.attempts + 1;
        });
        dispatched += 1;
        totalDispatched += 1;
      };
    };

    if (dispatched > 0) {
      for (i in Iter.range(0, directives.size() - 1)) {
        let d = directives.get(i);
        if (d.id == directiveId) {
          directives.put(i, {
            id = d.id; intent = d.intent; priority = d.priority;
            source = d.source; tasks = d.tasks; status = #InFlight;
            createdAt = d.createdAt; completedAt = null;
          });
        };
      };
    };

    auditLog.add("DISPATCH #" # Nat.toText(directiveId) # " → " #
                 Nat.toText(dispatched) # " tasks");
    dispatched
  };

  // ══════════════════════════════════════════════════════════════════
  //  SUB-MODEL: LIFECYCLE — Completion & Failure
  // ══════════════════════════════════════════════════════════════════

  /// Report task completion.
  public func completeTask(taskId : Nat, result : Text) : async Bool {
    for (i in Iter.range(0, tasks.size() - 1)) {
      let t = tasks.get(i);
      if (t.id == taskId) {
        tasks.put(i, {
          id = t.id; directiveId = t.directiveId;
          description = t.description; assignedTo = t.assignedTo;
          weight = t.weight; status = #Completed;
          result = ?result; createdAt = t.createdAt;
          completedAt = ?Time.now(); attempts = t.attempts;
        });
        totalCompleted += 1;

        // Update agent stats
        _recordAgentSuccess(t.assignedTo);
        ignore _checkDirectiveCompletion(t.directiveId);
        auditLog.add("COMPLETE task #" # Nat.toText(taskId));
        return true;
      };
    };
    false
  };

  /// Report task failure.
  public func failTask(taskId : Nat, reason : Text) : async Bool {
    for (i in Iter.range(0, tasks.size() - 1)) {
      let t = tasks.get(i);
      if (t.id == taskId) {
        tasks.put(i, {
          id = t.id; directiveId = t.directiveId;
          description = t.description; assignedTo = t.assignedTo;
          weight = t.weight; status = #Failed;
          result = ?("FAILED: " # reason); createdAt = t.createdAt;
          completedAt = ?Time.now(); attempts = t.attempts;
        });
        totalFailed += 1;

        _recordAgentFailure(t.assignedTo);
        auditLog.add("FAIL task #" # Nat.toText(taskId) # ": " # reason);
        return true;
      };
    };
    false
  };

  func _checkDirectiveCompletion(directiveId : Nat) : Bool {
    var allDone = true;
    var anyFailed = false;

    for (t in tasks.vals()) {
      if (t.directiveId == directiveId) {
        switch (t.status) {
          case (#Completed) {};
          case (#Failed)    { anyFailed := true };
          case _            { allDone := false };
        };
      };
    };

    if (allDone) {
      let finalStatus : DirectiveStatus = if anyFailed #Failed else #Completed;
      for (i in Iter.range(0, directives.size() - 1)) {
        let d = directives.get(i);
        if (d.id == directiveId) {
          directives.put(i, {
            id = d.id; intent = d.intent; priority = d.priority;
            source = d.source; tasks = d.tasks; status = finalStatus;
            createdAt = d.createdAt; completedAt = ?Time.now();
          });
        };
      };
      let suffix = if anyFailed " FAILED" else " COMPLETED";
      auditLog.add("DIRECTIVE #" # Nat.toText(directiveId) # suffix);
    };
    allDone
  };

  func _recordAgentSuccess(agentId : AlphaAgentId) {
    for (i in Iter.range(0, alphaAgents.size() - 1)) {
      let a = alphaAgents.get(i);
      if (agentEq(a.id, agentId)) {
        alphaAgents.put(i, {
          id = a.id; name = a.name; capabilities = a.capabilities;
          health = Float.min(1.0, a.health + 0.01);
          lastSeen = Time.now();
          tasksCompleted = a.tasksCompleted + 1;
          tasksFailed = a.tasksFailed;
          status = #Active;
        });
      };
    };
  };

  func _recordAgentFailure(agentId : AlphaAgentId) {
    for (i in Iter.range(0, alphaAgents.size() - 1)) {
      let a = alphaAgents.get(i);
      if (agentEq(a.id, agentId)) {
        let newHealth = Float.max(0.0, a.health - 0.05);
        let newStatus : AlphaAgentStatus = if (newHealth < 0.3) #Degraded else #Active;
        alphaAgents.put(i, {
          id = a.id; name = a.name; capabilities = a.capabilities;
          health = newHealth; lastSeen = Time.now();
          tasksCompleted = a.tasksCompleted;
          tasksFailed = a.tasksFailed + 1;
          status = newStatus;
        });
      };
    };
  };

  // ══════════════════════════════════════════════════════════════════
  //  SUB-MODEL: QUORUM — Alpha Agent Consensus
  // ══════════════════════════════════════════════════════════════════

  /// Request a quorum vote from Alpha agents.
  public func requestQuorum(question : Text) : async QuorumRequest {
    let id = nextQuorumId;
    nextQuorumId += 1;

    let qr : QuorumRequest = {
      id; question;
      responses  = [];
      threshold  = PHI_INV;
      resolved   = false;
      resolution = null;
      createdAt  = Time.now();
    };

    quorums.add(qr);
    auditLog.add("QUORUM #" # Nat.toText(id) # " requested: " # question);
    qr
  };

  /// Submit a quorum response from an Alpha agent.
  public func submitQuorumResponse(
    quorumId   : Nat,
    agent      : AlphaAgentId,
    response   : Text,
    confidence : Float
  ) : async Bool {
    for (i in Iter.range(0, quorums.size() - 1)) {
      let q = quorums.get(i);
      if (q.id == quorumId and not q.resolved) {
        let newResponses = Buffer.Buffer<(AlphaAgentId, Text, Float)>(q.responses.size() + 1);
        for (r in q.responses.vals()) { newResponses.add(r) };
        newResponses.add((agent, response, confidence));

        let responses = Buffer.toArray(newResponses);

        // φ-weighted confidence
        var totalWeight : Float = 0.0;
        var idx : Nat = 0;
        for ((_, _, conf) in responses.vals()) {
          totalWeight += conf * Float.pow(PHI, -1.0 * Float.fromInt(idx));
          idx += 1;
        };
        let avgConfidence = totalWeight / Float.fromInt(responses.size());
        let resolved = avgConfidence >= q.threshold and responses.size() >= 3;

        quorums.put(i, {
          id = q.id; question = q.question;
          responses; threshold = q.threshold;
          resolved;
          resolution = if resolved ?("Quorum reached: avg_conf=" # Float.toText(avgConfidence)) else null;
          createdAt = q.createdAt;
        });

        if (resolved) {
          auditLog.add("QUORUM #" # Nat.toText(quorumId) # " RESOLVED");
        };
        return true;
      };
    };
    false
  };

  // ══════════════════════════════════════════════════════════════════
  //  QUERIES — The Observable Surface
  // ══════════════════════════════════════════════════════════════════

  public query func getDirective(id : Nat) : async ?Directive {
    for (d in directives.vals()) { if (d.id == id) { return ?d } };
    null
  };

  public query func listDirectives() : async [Directive] {
    Buffer.toArray(directives)
  };

  public query func listTasks(directiveId : Nat) : async [Task] {
    let buf = Buffer.Buffer<Task>(16);
    for (t in tasks.vals()) {
      if (t.directiveId == directiveId) { buf.add(t) };
    };
    Buffer.toArray(buf)
  };

  public query func listTasksByAgent(agent : AlphaAgentId) : async [Task] {
    let buf = Buffer.Buffer<Task>(16);
    for (t in tasks.vals()) {
      if (agentEq(t.assignedTo, agent)) { buf.add(t) };
    };
    Buffer.toArray(buf)
  };

  public query func listAlphaAgents() : async [AlphaAgent] {
    Buffer.toArray(alphaAgents)
  };

  public query func listQuorums() : async [QuorumRequest] {
    Buffer.toArray(quorums)
  };

  public query func getAuditLog() : async [Text] {
    Buffer.toArray(auditLog)
  };

  public query func getDiagLog() : async [DiagSnapshot] {
    Buffer.toArray(diagLog)
  };

  // ══════════════════════════════════════════════════════════════════
  //  DIAGNOSTICS & SELF-HEALING — The Immune System
  // ══════════════════════════════════════════════════════════════════

  public query func diag() : async {
    status          : Text;
    health          : Float;
    alive           : Bool;
    heartbeats      : Nat;
    directives      : Nat;
    tasks           : Nat;
    dispatched      : Nat;
    completed       : Nat;
    failed          : Nat;
    quorums         : Nat;
    agentsOnline    : Nat;
    completionRate  : Float;
    epoch           : Nat;
    registeredInMesh : Bool;
    timestamp       : Int;
  } {
    let rate = if (totalDispatched == 0) 1.0
               else Float.fromInt(totalCompleted) / Float.fromInt(totalDispatched);
    var online : Nat = 0;
    for (a in alphaAgents.vals()) {
      if (a.status == #Active) { online += 1 };
    };
    {
      status         = if (not initialized) "GENESIS_PENDING"
                       else if (rate > PHI_INV) "ORCHESTRATING"
                       else "DEGRADED";
      health         = rate;
      alive          = initialized;
      heartbeats     = heartbeatCount;
      directives     = directives.size();
      tasks          = tasks.size();
      dispatched     = totalDispatched;
      completed      = totalCompleted;
      failed         = totalFailed;
      quorums        = quorums.size();
      agentsOnline   = online;
      completionRate = rate;
      epoch          = epochCount;
      registeredInMesh;
      timestamp      = Time.now();
    }
  };

  /// Manual heal trigger (heartbeat does this automatically too)
  public func heal() : async Text {
    _selfHeal();
    "AlphaOrchestrator heal: self-heal cycle executed."
  };

  public func register() : async Text {
    "AlphaOrchestrator registered. Capabilities: [orchestration, dispatch, lifecycle, quorum, alpha_routing]. ALIVE."
  };

  public query func report_status() : async Text {
    let rate = if (totalDispatched == 0) 1.0
               else Float.fromInt(totalCompleted) / Float.fromInt(totalDispatched);
    "ALPHA_ORCHESTRATOR | alive=" # (if initialized "true" else "false") #
    " heartbeats=" # Nat.toText(heartbeatCount) #
    " directives=" # Nat.toText(directives.size()) #
    " tasks=" # Nat.toText(tasks.size()) #
    " dispatched=" # Nat.toText(totalDispatched) #
    " completed=" # Nat.toText(totalCompleted) #
    " failed=" # Nat.toText(totalFailed) #
    " rate=" # Float.toText(rate) #
    " mesh=" # (if registeredInMesh "true" else "false")
  };

  // ══════════════════════════════════════════════════════════════════
  //  HELPERS
  // ══════════════════════════════════════════════════════════════════

  func agentEq(a : AlphaAgentId, b : AlphaAgentId) : Bool {
    agentToNat(a) == agentToNat(b)
  };

  func agentToNat(a : AlphaAgentId) : Nat {
    switch (a) {
      case (#THESIS)            0;
      case (#CodexPhantasmatis) 1;
      case (#CIVOS_PRIME)       2;
      case (#AURO)              3;
      case (#ORIGO)             4;
    }
  };

  // ══════════════════════════════════════════════════════════════════
  //  IDENTITY — Who We Are
  // ══════════════════════════════════════════════════════════════════

  public query func name() : async Text { "ALPHA_ORCHESTRATOR" };

  public query func designation() : async Text {
    "The Sovereign Directive Router — One voice issues the directive, the orchestra moves as one. ALIVE."
  };
};
