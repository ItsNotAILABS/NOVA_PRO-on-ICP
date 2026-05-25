///
/// SANPROTO GRID — The Wiring Infrastructure
///
/// Twin speaker #2. Only sanskrit_proto and sanproto_grid can SPEAK.
/// This is the electrical grid — routes signals between organisms.
///
/// Architecture:
///   - Wires connect organisms (directed edges)
///   - Nodes are organisms (vertices)
///   - Signals flow through wires based on Kāraka roles
///   - Voltage (φ-weight) determines signal priority
///   - All listeners receive broadcasts they subscribed to
///

import Array "mo:base/Array";
import Buffer "mo:base/Buffer";
import HashMap "mo:base/HashMap";
import Iter "mo:base/Iter";
import Nat "mo:base/Nat";
import Nat32 "mo:base/Nat32";
import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Text "mo:base/Text";
import Time "mo:base/Time";
import Float "mo:base/Float";

persistent actor SanprotoGrid {

  // ══════════════════════════════════════════════════════════════════
  //  CONSTANTS
  // ══════════════════════════════════════════════════════════════════

  transient let PHI : Float = 1.6180339887498948482;
  transient let PHI2 : Float = 2.6180339887498948482;
  transient let PHI3 : Float = 4.2360679774997896964;

  // ══════════════════════════════════════════════════════════════════
  //  TWIN SPEAKER — Only sanskrit_proto can speak to us
  // ══════════════════════════════════════════════════════════════════

  stable var twinSpeakerId : ?Principal = null;

  public shared(msg) func setTwinSpeaker(protoCanister : Principal) : async () {
    twinSpeakerId := ?protoCanister;
  };

  func isTwinSpeaker(caller : Principal) : Bool {
    switch (twinSpeakerId) {
      case null false;
      case (?twin) Principal.equal(caller, twin);
    }
  };

  // ══════════════════════════════════════════════════════════════════
  //  GRID SIGNAL — Same type as sanskrit_proto
  // ══════════════════════════════════════════════════════════════════

  public type Karaka = {
    #Karta;
    #Karma;
    #Karana;
    #Sampradana;
    #Apadana;
    #Adhikarana;
  };

  public type GridSignal = {
    id : Text;
    source : Principal;
    dhatu : Text;
    karaka : Karaka;
    payload : Text;
    voltage : Float;
    timestamp : Int;
  };

  // ══════════════════════════════════════════════════════════════════
  //  WIRE — A Connection Between Two Organisms
  // ══════════════════════════════════════════════════════════════════

  public type Wire = {
    id : Text;
    from : Principal;        // source organism
    to : Principal;          // destination organism
    dhatus : [Text];         // which dhātus flow through this wire
    resistance : Float;      // signal attenuation (0 = perfect, 1 = blocked)
    active : Bool;
    created : Int;
  };

  stable var wires : [(Text, Wire)] = [];
  transient var wireMap : HashMap.HashMap<Text, Wire> = HashMap.HashMap<Text, Wire>(
    256, Text.equal, Text.hash
  );

  // ══════════════════════════════════════════════════════════════════
  //  NODE — An Organism on the Grid
  // ══════════════════════════════════════════════════════════════════

  public type Node = {
    canisterId : Principal;
    name : Text;
    nodeType : NodeType;
    subscribedDhatus : [Text];
    inWires : [Text];        // wire IDs coming in
    outWires : [Text];       // wire IDs going out
    registered : Int;
  };

  public type NodeType = {
    #Speaker;    // Can speak (only sanskrit_proto and sanproto_grid)
    #Listener;   // Can only receive/understand
  };

  stable var nodes : [(Principal, Node)] = [];
  transient var nodeMap : HashMap.HashMap<Principal, Node> = HashMap.HashMap<Principal, Node>(
    128, Principal.equal, Principal.hash
  );

  // ══════════════════════════════════════════════════════════════════
  //  SIGNAL QUEUE — Pending broadcasts
  // ══════════════════════════════════════════════════════════════════

  stable var signalLog : [GridSignal] = [];
  transient var signalQueue : Buffer.Buffer<GridSignal> = Buffer.Buffer<GridSignal>(512);

  // ══════════════════════════════════════════════════════════════════
  //  RECEIVE FROM PROTO — Twin speaker communication
  // ══════════════════════════════════════════════════════════════════

  public shared(msg) func receiveFromProto(signal : GridSignal) : async () {
    // Only accept from twin speaker
    if (not isTwinSpeaker(msg.caller)) {
      return;
    };
    
    signalQueue.add(signal);
    
    // Route to all listeners subscribed to this dhātu
    await broadcastSignal(signal);
  };

  // ══════════════════════════════════════════════════════════════════
  //  SPEAK TO PROTO — Send signal back to twin
  // ══════════════════════════════════════════════════════════════════

  public func speakToProto(dhatu : Text, karaka : Karaka, payload : Text) : async Result.Result<(), Text> {
    switch (twinSpeakerId) {
      case null #err("Twin speaker not set");
      case (?protoId) {
        let signal : GridSignal = {
          id = "GRID-" # Nat.toText(signalQueue.size());
          source = Principal.fromActor(SanprotoGrid);
          dhatu = dhatu;
          karaka = karaka;
          payload = payload;
          voltage = PHI2;
          timestamp = Time.now();
        };
        
        signalQueue.add(signal);
        
        let proto : actor { speak : (GridSignal) -> async Result.Result<(), Text> } = actor (Principal.toText(protoId));
        await proto.speak(signal)
      };
    }
  };

  // ══════════════════════════════════════════════════════════════════
  //  BROADCAST — Route signal to subscribed listeners
  // ══════════════════════════════════════════════════════════════════

  func broadcastSignal(signal : GridSignal) : async () {
    for ((_, node) in nodeMap.entries()) {
      // Check if node subscribes to this dhātu
      let subscribed = Array.find<Text>(node.subscribedDhatus, func(d) { d == signal.dhatu });
      switch (subscribed) {
        case null {};
        case (?_) {
          // Send to listener (they can only receive, not respond in SanProto)
          let listener : actor { 
            receiveSanprotoSignal : (GridSignal) -> async () 
          } = actor (Principal.toText(node.canisterId));
          ignore listener.receiveSanprotoSignal(signal);
        };
      };
    };
  };

  // ══════════════════════════════════════════════════════════════════
  //  REGISTER NODE — Add organism to grid
  // ══════════════════════════════════════════════════════════════════

  public shared(msg) func registerNode(name : Text, dhatus : [Text]) : async () {
    let node : Node = {
      canisterId = msg.caller;
      name = name;
      nodeType = #Listener;  // All external organisms are listeners only
      subscribedDhatus = dhatus;
      inWires = [];
      outWires = [];
      registered = Time.now();
    };
    nodeMap.put(msg.caller, node);
  };

  // ══════════════════════════════════════════════════════════════════
  //  CREATE WIRE — Connect two organisms
  // ══════════════════════════════════════════════════════════════════

  public func createWire(from : Principal, to : Principal, dhatus : [Text]) : async Text {
    let wireId = "WIRE-" # Nat.toText(wireMap.size());
    let wire : Wire = {
      id = wireId;
      from = from;
      to = to;
      dhatus = dhatus;
      resistance = 0.0;  // perfect conductor
      active = true;
      created = Time.now();
    };
    wireMap.put(wireId, wire);
    
    // Update nodes with wire references
    switch (nodeMap.get(from)) {
      case null {};
      case (?fromNode) {
        let updated = {
          fromNode with
          outWires = Array.append(fromNode.outWires, [wireId]);
        };
        nodeMap.put(from, updated);
      };
    };
    
    switch (nodeMap.get(to)) {
      case null {};
      case (?toNode) {
        let updated = {
          toNode with
          inWires = Array.append(toNode.inWires, [wireId]);
        };
        nodeMap.put(to, updated);
      };
    };
    
    wireId
  };

  // ══════════════════════════════════════════════════════════════════
  //  ROUTE SIGNAL — Send through specific wire
  // ══════════════════════════════════════════════════════════════════

  public func routeSignal(wireId : Text, signal : GridSignal) : async Result.Result<(), Text> {
    switch (wireMap.get(wireId)) {
      case null #err("Wire not found");
      case (?wire) {
        if (not wire.active) {
          return #err("Wire inactive");
        };
        
        // Check if dhātu is allowed on this wire
        let allowed = Array.find<Text>(wire.dhatus, func(d) { d == signal.dhatu or d == "*" });
        switch (allowed) {
          case null #err("Dhātu not permitted on this wire");
          case (?_) {
            // Apply resistance (voltage drop)
            let attenuatedSignal = {
              signal with
              voltage = signal.voltage * (1.0 - wire.resistance);
            };
            
            // Deliver to destination
            switch (nodeMap.get(wire.to)) {
              case null #err("Destination node not found");
              case (?destNode) {
                let dest : actor { 
                  receiveSanprotoSignal : (GridSignal) -> async () 
                } = actor (Principal.toText(destNode.canisterId));
                ignore dest.receiveSanprotoSignal(attenuatedSignal);
                #ok(())
              };
            }
          };
        }
      };
    }
  };

  // ══════════════════════════════════════════════════════════════════
  //  QUERY — Read grid state
  // ══════════════════════════════════════════════════════════════════

  public query func getNode(canisterId : Principal) : async ?Node {
    nodeMap.get(canisterId)
  };

  public query func getAllNodes() : async [Node] {
    let buf = Buffer.Buffer<Node>(64);
    for ((_, n) in nodeMap.entries()) {
      buf.add(n);
    };
    Buffer.toArray(buf)
  };

  public query func getWire(wireId : Text) : async ?Wire {
    wireMap.get(wireId)
  };

  public query func getAllWires() : async [Wire] {
    let buf = Buffer.Buffer<Wire>(128);
    for ((_, w) in wireMap.entries()) {
      buf.add(w);
    };
    Buffer.toArray(buf)
  };

  public query func getSignalQueue() : async [GridSignal] {
    Buffer.toArray(signalQueue)
  };

  public query func getGridStats() : async {
    nodeCount : Nat;
    wireCount : Nat;
    signalCount : Nat;
    activePaths : Nat;
  } {
    var activePaths = 0;
    for ((_, w) in wireMap.entries()) {
      if (w.active) activePaths += 1;
    };
    {
      nodeCount = nodeMap.size();
      wireCount = wireMap.size();
      signalCount = signalQueue.size();
      activePaths = activePaths;
    }
  };

  // ══════════════════════════════════════════════════════════════════
  //  LIFECYCLE
  // ══════════════════════════════════════════════════════════════════

  system func preupgrade() {
    wires := Iter.toArray(wireMap.entries());
    nodes := Iter.toArray(nodeMap.entries());
    signalLog := Buffer.toArray(signalQueue);
  };

  system func postupgrade() {
    for ((id, w) in wires.vals()) {
      wireMap.put(id, w);
    };
    for ((id, n) in nodes.vals()) {
      nodeMap.put(id, n);
    };
    for (s in signalLog.vals()) {
      signalQueue.add(s);
    };
  };

  public query func name() : async Text { "SANPROTO_GRID" };
}
