///
/// SANSKRIT PROTO — NOVA's Own Protocol Foundation Language
///
/// Proto = Protocol. This is NOVA's OWN symbolic language.
/// Inspired by Sanskrit's precise grammatical structure, but with
/// NOVA's own symbols and meanings.
///
/// The two SanProto speakers: sanskrit_proto + sanproto_grid
/// Only these two can SPEAK Sanskrit Proto to each other.
/// All other organisms can LISTEN/UNDERSTAND but cannot speak.
///
/// NOVA SANSKRIT PROTO SYMBOLS:
///
///   ◈ (dhātu)     = Root primitive (voltage source)
///   ⟁ (karaka)    = Semantic role (circuit pathway)
///   ⧫ (vibhakti)  = Case ending (wire connection)
///   ⟐ (pratyaya)  = Suffix (transformer)
///   ◉ (pada)      = Word unit (complete signal)
///   ⟰ (vākya)     = Sentence (complete circuit)
///
/// NOVA DHĀTU ROOTS (◈):
///
///   ◈भू  = existence/becoming      → state operations
///   ◈कृ  = action/creation         → execution operations
///   ◈गम् = movement/transfer       → data flow
///   ◈स्था = standing/persistence   → memory operations
///   ◈दा  = giving/emission         → output operations
///   ◈ग्र  = grasping/receiving     → input operations
///   ◈वद् = speaking/declaring      → protocol messages
///   ◈श्रु = hearing/listening      → signal reception
///   ◈ज्ञा = knowing/cognition      → intelligence operations
///   ◈धृ  = holding/maintaining     → state persistence
///
/// Grid/Wiring Architecture — Like electrical circuits:
///   - Dhātu (◈) = Voltage sources
///   - Pratyaya (⟐) = Resistors/Transformers  
///   - Kāraka (⟁) = Circuit pathways
///   - Vibhakti (⧫) = Wire connections
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

persistent actor SanskritProto {

  // ══════════════════════════════════════════════════════════════════
  //  CONSTANTS — Golden Ratio + Vedic Numbers
  // ══════════════════════════════════════════════════════════════════

  transient let PHI : Float = 1.6180339887498948482;
  transient let PHI2 : Float = 2.6180339887498948482;
  transient let PHI3 : Float = 4.2360679774997896964;

  // ══════════════════════════════════════════════════════════════════
  //  THE TWIN SPEAKER — Only sanproto_grid can speak back
  // ══════════════════════════════════════════════════════════════════

  stable var twinSpeakerId : ?Principal = null;

  public shared(msg) func setTwinSpeaker(gridCanister : Principal) : async () {
    twinSpeakerId := ?gridCanister;
  };

  func isTwinSpeaker(caller : Principal) : Bool {
    switch (twinSpeakerId) {
      case null false;
      case (?twin) Principal.equal(caller, twin);
    }
  };

  // ══════════════════════════════════════════════════════════════════
  //  ◈ DHĀTU — NOVA ROOT PRIMITIVES — Voltage Sources
  // ══════════════════════════════════════════════════════════════════
  //
  //  NOVA's own irreducible functional primitives.
  //  Symbol: ◈ (diamond with dot)
  //
  //  ◈BHU  = existence/becoming      [PHI³]
  //  ◈KRI  = action/creation         [PHI³]
  //  ◈GAM  = movement/transfer       [PHI²]
  //  ◈STHA = standing/persistence    [PHI²]
  //  ◈DA   = giving/emission         [PHI²]
  //  ◈GRA  = grasping/receiving      [PHI²]
  //  ◈VAD  = speaking/declaring      [PHI]
  //  ◈SHRU = hearing/listening       [PHI]
  //  ◈JNA  = knowing/cognition       [PHI³]
  //  ◈DHRI = holding/maintaining     [PHI²]
  //

  public type Dhatu = {
    id : Text;           // NOVA symbol: "◈BHU", "◈KRI", etc.
    root : Text;         // Sanskrit inspiration: "भू", "कृ"
    meaning : Text;      // NOVA meaning
    voltage : Nat;       // Power level (1-4, maps to PHI^n)
    direction : Text;    // "in" | "out" | "internal" | "bidirectional"
    phiWeight : Float;   // φ-weighted importance
  };

  // The 10 NOVA dhātu roots
  stable var dhatuRoots : [(Text, Dhatu)] = [];
  transient var dhatuMap : HashMap.HashMap<Text, Dhatu> = HashMap.HashMap<Text, Dhatu>(
    32, Text.equal, Text.hash
  );

  // ══════════════════════════════════════════════════════════════════
  //  ⟁ KĀRAKA — NOVA SEMANTIC ROLES — Circuit Pathways
  // ══════════════════════════════════════════════════════════════════
  //
  //  NOVA's 6 pathway types. Symbol: ⟁ (triangle)
  //  WHO does WHAT to WHOM through WHERE.
  //

  public type Karaka = {
    #Agent;      // ⟁A — who performs the action
    #Patient;    // ⟁P — what is affected
    #Instrument; // ⟁I — by what means
    #Recipient;  // ⟁R — for whom / destination
    #Source;     // ⟁S — from where / origin
    #Locus;      // ⟁L — where/when / context
  };

  // ══════════════════════════════════════════════════════════════════
  //  ⧫ VIBHAKTI — NOVA CASE MARKERS — Wire Connections
  // ══════════════════════════════════════════════════════════════════
  //
  //  NOVA's 8 connection types. Symbol: ⧫ (diamond)
  //

  public type Vibhakti = {
    #Subject;    // ⧫1 — the actor
    #Object;     // ⧫2 — the target
    #Means;      // ⧫3 — the tool/method
    #Purpose;    // ⧫4 — the goal/reason
    #Origin;     // ⧫5 — the source
    #Possession; // ⧫6 — ownership/relation
    #Location;   // ⧫7 — place/time/state
    #Address;    // ⧫8 — direct invocation
    #Sambodhana; // Vocative (8th) — address
  };

  // ══════════════════════════════════════════════════════════════════
  //  ◉ PADA — NOVA WORD UNIT — Complete Signal Packet
  // ══════════════════════════════════════════════════════════════════
  //
  //  Symbol: ◉ (circled dot)
  //  A complete signal packet ready for transmission.
  //

  public type Pada = {
    dhatu : Text;           // ◈ root primitive
    pratyaya : [Text];      // ⟐ suffixes/transformers applied
    vibhakti : Vibhakti;    // ⧫ wire connection type
    multiplicity : Nat;     // 1=single, 2=pair, 3=many
    priority : Nat;         // 1=low, 2=normal, 3=high, 4=critical
    meaning : Text;         // derived meaning
  };

  // ══════════════════════════════════════════════════════════════════
  //  ⟰ VĀKYA — NOVA SENTENCE — Complete Circuit
  // ══════════════════════════════════════════════════════════════════
  //
  //  Symbol: ⟰ (rising arrow)
  //  A complete circuit connecting multiple organisms.
  //

  public type Vakya = {
    id : Text;
    padas : [Pada];         // ◉ signal packets
    agents : [Text];        // ⟁A organisms performing
    patients : [Text];      // ⟁P organisms affected
    timestamp : Int;
    phiWeight : Float;
  };

  stable var vakyaLog : [Vakya] = [];
  transient var vakyaBuffer : Buffer.Buffer<Vakya> = Buffer.Buffer<Vakya>(256);

  // ══════════════════════════════════════════════════════════════════
  //  ⚡ GRID SIGNAL — Message on the Wire
  // ══════════════════════════════════════════════════════════════════

  public type GridSignal = {
    id : Text;
    source : Principal;      // sender canister
    dhatu : Text;            // root operation
    karaka : Karaka;         // semantic role
    payload : Text;          // encoded data
    voltage : Float;         // signal strength (φ-scaled)
    timestamp : Int;
  };

  stable var signalLog : [GridSignal] = [];
  transient var signalBuffer : Buffer.Buffer<GridSignal> = Buffer.Buffer<GridSignal>(512);

  // ══════════════════════════════════════════════════════════════════
  //  LISTENER REGISTRY — Organisms that can UNDERSTAND
  // ══════════════════════════════════════════════════════════════════

  public type Listener = {
    canisterId : Principal;
    name : Text;
    subscribedDhatus : [Text];  // which roots they listen to
    registered : Int;
  };

  stable var listeners : [(Principal, Listener)] = [];
  transient var listenerMap : HashMap.HashMap<Principal, Listener> = HashMap.HashMap<Principal, Listener>(
    128, Principal.equal, Principal.hash
  );

  // ══════════════════════════════════════════════════════════════════
  //  INITIALIZATION — Seed the 10 NOVA Dhātu Roots
  // ══════════════════════════════════════════════════════════════════

  public func initialize() : async () {
    // ◈BHU — existence/becoming — state operations
    registerDhatu({ id = "◈BHU"; root = "भू"; meaning = "existence, becoming, state change"; voltage = 3; direction = "internal"; phiWeight = PHI3 });
    
    // ◈KRI — action/creation — execution operations
    registerDhatu({ id = "◈KRI"; root = "कृ"; meaning = "action, creation, execution"; voltage = 3; direction = "out"; phiWeight = PHI3 });
    
    // ◈GAM — movement/transfer — data flow operations
    registerDhatu({ id = "◈GAM"; root = "गम्"; meaning = "movement, transfer, data flow"; voltage = 2; direction = "bidirectional"; phiWeight = PHI2 });
    
    // ◈STHA — standing/persistence — memory operations
    registerDhatu({ id = "◈STHA"; root = "स्था"; meaning = "standing, persistence, stability"; voltage = 2; direction = "internal"; phiWeight = PHI2 });
    
    // ◈DA — giving/emission — output operations
    registerDhatu({ id = "◈DA"; root = "दा"; meaning = "giving, emission, output"; voltage = 2; direction = "out"; phiWeight = PHI2 });
    
    // ◈GRA — grasping/receiving — input operations
    registerDhatu({ id = "◈GRA"; root = "ग्रह्"; meaning = "grasping, receiving, input"; voltage = 2; direction = "in"; phiWeight = PHI2 });
    
    // ◈VAD — speaking/declaring — protocol messages
    registerDhatu({ id = "◈VAD"; root = "वद्"; meaning = "speaking, declaring, protocol"; voltage = 1; direction = "out"; phiWeight = PHI });
    
    // ◈SHRU — hearing/listening — signal reception
    registerDhatu({ id = "◈SHRU"; root = "श्रु"; meaning = "hearing, listening, reception"; voltage = 1; direction = "in"; phiWeight = PHI });
    
    // ◈JNA — knowing/cognition — intelligence operations
    registerDhatu({ id = "◈JNA"; root = "ज्ञा"; meaning = "knowing, cognition, intelligence"; voltage = 3; direction = "internal"; phiWeight = PHI3 });
    
    // ◈DHRI — holding/maintaining — state persistence
    registerDhatu({ id = "◈DHRI"; root = "धृ"; meaning = "holding, maintaining, persistence"; voltage = 2; direction = "internal"; phiWeight = PHI2 });
  };

  func registerDhatu(d : Dhatu) : () {
    dhatuMap.put(d.id, d);
  };

  // ══════════════════════════════════════════════════════════════════
  //  ⚡ SPEAK — Only callable by twin speaker (sanproto_grid)
  // ══════════════════════════════════════════════════════════════════

  public shared(msg) func speak(signal : GridSignal) : async Result.Result<(), Text> {
    if (not isTwinSpeaker(msg.caller)) {
      return #err("Only twin speaker can speak Sanskrit Proto");
    };
    
    signalBuffer.add(signal);
    #ok(())
  };

  // ══════════════════════════════════════════════════════════════════
  //  ⚡ EMIT — Internal: Generate signal TO grid
  // ══════════════════════════════════════════════════════════════════

  public func emit(dhatu : Text, karaka : Karaka, payload : Text) : async Result.Result<Text, Text> {
    let signal : GridSignal = {
      id = "⚡" # Nat.toText(signalBuffer.size());
      source = Principal.fromActor(SanskritProto);
      dhatu = dhatu;
      karaka = karaka;
      payload = payload;
      voltage = switch (dhatuMap.get(dhatu)) {
        case null PHI;
        case (?d) d.phiWeight;
      };
      timestamp = Time.now();
    };
    
    signalBuffer.add(signal);
    
    // Notify twin speaker (grid)
    switch (twinSpeakerId) {
      case null {};
      case (?gridId) {
        let grid : actor { receiveFromProto : (GridSignal) -> async () } = actor (Principal.toText(gridId));
        ignore grid.receiveFromProto(signal);
      };
    };
    
    #ok(signal.id)
  };

  // ══════════════════════════════════════════════════════════════════
  //  REGISTER LISTENER — Organisms subscribe to understand
  // ══════════════════════════════════════════════════════════════════

  public shared(msg) func registerListener(name : Text, dhatus : [Text]) : async () {
    let listener : Listener = {
      canisterId = msg.caller;
      name = name;
      subscribedDhatus = dhatus;
      registered = Time.now();
    };
    listenerMap.put(msg.caller, listener);
  };

  // ══════════════════════════════════════════════════════════════════
  //  QUERY — Read operations (all can read)
  // ══════════════════════════════════════════════════════════════════

  public query func getDhatu(id : Text) : async ?Dhatu {
    dhatuMap.get(id)
  };

  public query func getAllDhatus() : async [Dhatu] {
    let buf = Buffer.Buffer<Dhatu>(10);
    for ((_, d) in dhatuMap.entries()) {
      buf.add(d);
    };
    Buffer.toArray(buf)
  };

  public query func getRecentSignals(count : Nat) : async [GridSignal] {
    let size = signalBuffer.size();
    let start = if (size > count) size - count else 0;
    let buf = Buffer.Buffer<GridSignal>(count);
    var i = start;
    while (i < size) {
      buf.add(signalBuffer.get(i));
      i += 1;
    };
    Buffer.toArray(buf)
  };

  public query func getListeners() : async [Listener] {
    let buf = Buffer.Buffer<Listener>(64);
    for ((_, l) in listenerMap.entries()) {
      buf.add(l);
    };
    Buffer.toArray(buf)
  };

  // ══════════════════════════════════════════════════════════════════
  //  LIFECYCLE
  // ══════════════════════════════════════════════════════════════════

  system func preupgrade() {
    dhatuRoots := Iter.toArray(dhatuMap.entries());
    listeners := Iter.toArray(listenerMap.entries());
    signalLog := Buffer.toArray(signalBuffer);
    vakyaLog := Buffer.toArray(vakyaBuffer);
  };

  system func postupgrade() {
    for ((id, d) in dhatuRoots.vals()) {
      dhatuMap.put(id, d);
    };
    for ((id, l) in listeners.vals()) {
      listenerMap.put(id, l);
    };
    for (s in signalLog.vals()) {
      signalBuffer.add(s);
    };
    for (v in vakyaLog.vals()) {
      vakyaBuffer.add(v);
    };
  };

  public query func name() : async Text { "SANSKRIT_PROTO" };
}
