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

  // ── Constants ──────────────────────────────────────────────────────

  transient let PHI : Float = 1.6180339887498948482;
  transient let PHI_INV : Float = 0.6180339887498948482;

  // ── Types ──────────────────────────────────────────────────────────

  /// Alpha Agent identifiers — the five sovereign Alpha agents
  public type AlphaAgentId = {
    #THESIS;          // AGT-041: Research · IP · Proof · Publication
    #CodexPhantasmatis; // AGT-042: Implementation execution
    #CIVOS_PRIME;     // AGT-043: Governing orchestration
    #AURO;            // AGT-044: Native speaking intelligence
    #ORIGO;           // AGT-045: Operating architecture
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
    intent      : Text;           // Plain-language description
    priority    : DirectivePriority;
    source      : Principal;      // Who issued the directive
    tasks       : [Nat];          // Decomposed task IDs
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
    weight       : Float;         // φ-weighted priority within directive
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

  /// Quorum request — gather consensus across Alpha agents
  public type QuorumRequest = {
    id         : Nat;
    question   : Text;
    responses  : [(AlphaAgentId, Text, Float)]; // agent, response, confidence
    threshold  : Float;  // φ-derived threshold (default 0.618)
    resolved   : Bool;
    resolution : ?Text;
    createdAt  : Int;
  };

  // ── State ──────────────────────────────────────────────────────────

  stable var nextDirectiveId : Nat = 0;
  stable var nextTaskId      : Nat = 0;
  stable var nextQuorumId    : Nat = 0;
  stable var totalDispatched : Nat = 0;
  stable var totalCompleted  : Nat = 0;

  transient let directives = Buffer.Buffer<Directive>(64);
  transient let tasks      = Buffer.Buffer<Task>(256);
  transient let quorums    = Buffer.Buffer<QuorumRequest>(32);
  transient let eventLog   = Buffer.Buffer<Text>(512);

  // ── SUB-MODEL: DIRECTIVE — Intake & Decomposition ─────────────────

  /// Submit a new directive to the Alpha Orchestrator.
  /// The directive is queued for decomposition into routable tasks.
  public shared(msg) func submitDirective(
    intent   : Text,
    priority : DirectivePriority
  ) : async Directive {
    let id = nextDirectiveId;
    nextDirectiveId += 1;

    let directive : Directive = {
      id;
      intent;
      priority;
      source      = msg.caller;
      tasks       = [];
      status      = #Pending;
      createdAt   = Time.now();
      completedAt = null;
    };

    directives.add(directive);
    eventLog.add("DIRECTIVE #" # Nat.toText(id) # " submitted: " # intent);
    directive
  };

  /// Decompose a directive into tasks and assign to Alpha agents.
  /// Uses φ-weighted capability matching.
  public func decomposeDirective(
    directiveId : Nat,
    taskSpecs   : [(Text, AlphaAgentId)]  // (description, target agent)
  ) : async [Task] {
    let createdTasks = Buffer.Buffer<Task>(taskSpecs.size());
    let taskIds = Buffer.Buffer<Nat>(taskSpecs.size());

    var index : Nat = 0;
    for ((desc, agent) in taskSpecs.vals()) {
      let taskId = nextTaskId;
      nextTaskId += 1;

      // φ-weighted priority: first tasks have higher weight
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

    // Update directive with task IDs
    for (i in Iter.range(0, directives.size() - 1)) {
      let d = directives.get(i);
      if (d.id == directiveId) {
        directives.put(i, {
          id          = d.id;
          intent      = d.intent;
          priority    = d.priority;
          source      = d.source;
          tasks       = Buffer.toArray(taskIds);
          status      = #Decomposing;
          createdAt   = d.createdAt;
          completedAt = null;
        });
      };
    };

    eventLog.add("DECOMPOSE #" # Nat.toText(directiveId) #
                 " → " # Nat.toText(taskSpecs.size()) # " tasks");
    Buffer.toArray(createdTasks)
  };

  // ── SUB-MODEL: DISPATCH — φ-Weighted Routing ──────────────────────

  /// Dispatch all queued tasks for a directive.
  /// Marks tasks as dispatched and increments counters.
  public func dispatchDirective(directiveId : Nat) : async Nat {
    var dispatched : Nat = 0;

    for (i in Iter.range(0, tasks.size() - 1)) {
      let t = tasks.get(i);
      if (t.directiveId == directiveId and t.status == #Queued) {
        tasks.put(i, {
          id          = t.id;
          directiveId = t.directiveId;
          description = t.description;
          assignedTo  = t.assignedTo;
          weight      = t.weight;
          status      = #Dispatched;
          result      = t.result;
          createdAt   = t.createdAt;
          completedAt = null;
          attempts    = t.attempts + 1;
        });
        dispatched += 1;
        totalDispatched += 1;
      };
    };

    // Update directive status
    for (i in Iter.range(0, directives.size() - 1)) {
      let d = directives.get(i);
      if (d.id == directiveId) {
        directives.put(i, {
          id          = d.id;
          intent      = d.intent;
          priority    = d.priority;
          source      = d.source;
          tasks       = d.tasks;
          status      = #InFlight;
          createdAt   = d.createdAt;
          completedAt = null;
        });
      };
    };

    eventLog.add("DISPATCH #" # Nat.toText(directiveId) #
                 " → " # Nat.toText(dispatched) # " tasks sent");
    dispatched
  };

  // ── SUB-MODEL: LIFECYCLE — Workflow Tracking ───────────────────────

  /// Report task completion.
  public func completeTask(taskId : Nat, result : Text) : async Bool {
    for (i in Iter.range(0, tasks.size() - 1)) {
      let t = tasks.get(i);
      if (t.id == taskId) {
        tasks.put(i, {
          id          = t.id;
          directiveId = t.directiveId;
          description = t.description;
          assignedTo  = t.assignedTo;
          weight      = t.weight;
          status      = #Completed;
          result      = ?result;
          createdAt   = t.createdAt;
          completedAt = ?Time.now();
          attempts    = t.attempts;
        });
        totalCompleted += 1;

        // Check if all tasks for this directive are complete
        ignore checkDirectiveCompletion(t.directiveId);
        eventLog.add("COMPLETE task #" # Nat.toText(taskId));
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
          id          = t.id;
          directiveId = t.directiveId;
          description = t.description;
          assignedTo  = t.assignedTo;
          weight      = t.weight;
          status      = #Failed;
          result      = ?("FAILED: " # reason);
          createdAt   = t.createdAt;
          completedAt = ?Time.now();
          attempts    = t.attempts;
        });
        eventLog.add("FAIL task #" # Nat.toText(taskId) # ": " # reason);
        return true;
      };
    };
    false
  };

  /// Check if all tasks in a directive are done. If so, mark complete.
  func checkDirectiveCompletion(directiveId : Nat) : Bool {
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
      for (i in Iter.range(0, directives.size() - 1)) {
        let d = directives.get(i);
        if (d.id == directiveId) {
          directives.put(i, {
            id          = d.id;
            intent      = d.intent;
            priority    = d.priority;
            source      = d.source;
            tasks       = d.tasks;
            status      = if anyFailed #Failed else #Completed;
            createdAt   = d.createdAt;
            completedAt = ?Time.now();
          });
        };
      };
      let suffix = if anyFailed " FAILED" else " COMPLETED";
      eventLog.add("DIRECTIVE #" # Nat.toText(directiveId) # suffix);
    };
    allDone
  };

  // ── SUB-MODEL: QUORUM — Alpha Agent Consensus ─────────────────────

  /// Request a quorum vote from Alpha agents.
  public func requestQuorum(question : Text) : async QuorumRequest {
    let id = nextQuorumId;
    nextQuorumId += 1;

    let qr : QuorumRequest = {
      id;
      question;
      responses  = [];
      threshold  = PHI_INV;  // 0.618 — golden ratio threshold
      resolved   = false;
      resolution = null;
      createdAt  = Time.now();
    };

    quorums.add(qr);
    eventLog.add("QUORUM #" # Nat.toText(id) # " requested: " # question);
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

        // Check if quorum is met (φ-weighted confidence exceeds threshold)
        var totalWeight : Float = 0.0;
        var index : Nat = 0;
        for ((_, _, conf) in responses.vals()) {
          totalWeight += conf * Float.pow(PHI, -1.0 * Float.fromInt(index));
          index += 1;
        };
        let avgConfidence = totalWeight / Float.fromInt(responses.size());
        let resolved = avgConfidence >= q.threshold and responses.size() >= 3;

        quorums.put(i, {
          id         = q.id;
          question   = q.question;
          responses;
          threshold  = q.threshold;
          resolved;
          resolution = if resolved ?("Quorum reached: avg_conf=" # Float.toText(avgConfidence)) else null;
          createdAt  = q.createdAt;
        });

        if (resolved) {
          eventLog.add("QUORUM #" # Nat.toText(quorumId) # " RESOLVED");
        };
        return true;
      };
    };
    false
  };

  // ── Queries ────────────────────────────────────────────────────────

  public query func getDirective(id : Nat) : async ?Directive {
    for (d in directives.vals()) {
      if (d.id == id) { return ?d };
    };
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

  public query func listQuorums() : async [QuorumRequest] {
    Buffer.toArray(quorums)
  };

  public query func getEventLog() : async [Text] {
    Buffer.toArray(eventLog)
  };

  // ── Diagnostics ────────────────────────────────────────────────────

  public query func diag() : async {
    status          : Text;
    health          : Float;
    directives      : Nat;
    tasks           : Nat;
    dispatched      : Nat;
    completed       : Nat;
    quorums         : Nat;
    completionRate  : Float;
    timestamp       : Int;
  } {
    let rate = if (totalDispatched == 0) 1.0
               else Float.fromInt(totalCompleted) / Float.fromInt(totalDispatched);
    {
      status         = if (rate > PHI_INV) "ORCHESTRATING" else "DEGRADED";
      health         = rate;
      directives     = directives.size();
      tasks          = tasks.size();
      dispatched     = totalDispatched;
      completed      = totalCompleted;
      quorums        = quorums.size();
      completionRate = rate;
      timestamp      = Time.now();
    }
  };

  public func heal() : async Text {
    // Retry all failed tasks (up to 3 attempts)
    var retried : Nat = 0;
    for (i in Iter.range(0, tasks.size() - 1)) {
      let t = tasks.get(i);
      if (t.status == #Failed and t.attempts < 3) {
        tasks.put(i, {
          id          = t.id;
          directiveId = t.directiveId;
          description = t.description;
          assignedTo  = t.assignedTo;
          weight      = t.weight;
          status      = #Queued;
          result      = null;
          createdAt   = t.createdAt;
          completedAt = null;
          attempts    = t.attempts;
        });
        retried += 1;
      };
    };
    eventLog.add("HEAL: " # Nat.toText(retried) # " tasks re-queued");
    "AlphaOrchestrator heal: " # Nat.toText(retried) # " task(s) re-queued for retry."
  };

  public func register() : async Text {
    "AlphaOrchestrator registered. Capabilities: [orchestration, dispatch, lifecycle, quorum]."
  };

  public query func report_status() : async Text {
    "ALPHA_ORCHESTRATOR | directives=" # Nat.toText(directives.size()) #
    " tasks=" # Nat.toText(tasks.size()) #
    " dispatched=" # Nat.toText(totalDispatched) #
    " completed=" # Nat.toText(totalCompleted) #
    " quorums=" # Nat.toText(quorums.size())
  };

  // ── Helpers ────────────────────────────────────────────────────────

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

  // ── Identity ───────────────────────────────────────────────────────

  public query func name() : async Text { "ALPHA_ORCHESTRATOR" };

  public query func designation() : async Text {
    "The Sovereign Directive Router — One voice issues the directive, the orchestra moves as one"
  };
};
