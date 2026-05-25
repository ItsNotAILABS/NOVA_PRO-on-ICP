///
/// SANSKRIT PROTO — Foundation Layer for All Cognitive Languages
///
/// The two SanProto speakers: sanskrit_proto + sanproto_grid
/// Only these two can SPEAK Sanskrit Proto to each other.
/// All other organisms can LISTEN/UNDERSTAND but cannot speak.
///
/// Grid/Wiring Architecture — Like electrical circuits:
///   - Dhātu (धातु) = Root primitives = Voltage sources
///   - Pratyaya (प्रत्यय) = Suffixes = Resistors/Transformers  
///   - Kāraka (कारक) = Semantic roles = Circuit pathways
///   - Vibhakti (विभक्ति) = Case endings = Wire connections
///
/// Panini's grammar IS the formal specification.
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
  //  DHĀTU (धातु) — ROOT PRIMITIVES — The Voltage Sources
  // ══════════════════════════════════════════════════════════════════
  //
  //  These are the irreducible functional primitives.
  //  Every cognitive operation maps to a dhātu.
  //

  public type Dhatu = {
    id : Text;           // e.g., "भू" (bhū)
    meaning : Text;      // "to be, to become"
    gana : Nat;          // verb class (1-10)
    pada : Text;         // parasmaipada / ātmanepada
    phiWeight : Float;   // φ-weighted importance
  };

  // The 10 root dhātus that underpin all organism operations
  stable var dhatuRoots : [(Text, Dhatu)] = [];
  transient var dhatuMap : HashMap.HashMap<Text, Dhatu> = HashMap.HashMap<Text, Dhatu>(
    32, Text.equal, Text.hash
  );

  // ══════════════════════════════════════════════════════════════════
  //  KĀRAKA (कारक) — SEMANTIC ROLES — The Circuit Pathways
  // ══════════════════════════════════════════════════════════════════
  //
  //  Panini's 6 kārakas define WHO does WHAT to WHOM.
  //  These are the wires connecting organisms.
  //

  public type Karaka = {
    #Karta;      // Agent (कर्ता) — who performs
    #Karma;      // Patient (कर्म) — what is affected
    #Karana;     // Instrument (करण) — by what means
    #Sampradana; // Recipient (सम्प्रदान) — for whom
    #Apadana;    // Source (अपादान) — from where
    #Adhikarana; // Locus (अधिकरण) — where/when
  };

  // ══════════════════════════════════════════════════════════════════
  //  VIBHAKTI (विभक्ति) — CASE ENDINGS — Wire Connections
  // ══════════════════════════════════════════════════════════════════

  public type Vibhakti = {
    #Prathama;   // Nominative (1st) — subject
    #Dvitiya;    // Accusative (2nd) — object
    #Tritiya;    // Instrumental (3rd) — by/with
    #Chaturthi;  // Dative (4th) — for/to
    #Panchami;   // Ablative (5th) — from
    #Shashthi;   // Genitive (6th) — of/possession
    #Saptami;    // Locative (7th) — in/on/at
    #Sambodhana; // Vocative (8th) — address
  };

  // ══════════════════════════════════════════════════════════════════
  //  PADA (पद) — WORD UNIT — A Complete Signal
  // ══════════════════════════════════════════════════════════════════

  public type Pada = {
    dhatu : Text;           // root
    pratyaya : [Text];      // suffixes applied
    vibhakti : Vibhakti;    // case
    vacana : Nat;           // number (1=singular, 2=dual, 3=plural)
    purusha : Nat;          // person (1=third, 2=second, 3=first)
    meaning : Text;         // derived meaning
  };

  // ══════════════════════════════════════════════════════════════════
  //  VĀKYA (वाक्य) — SENTENCE — A Complete Circuit
  // ══════════════════════════════════════════════════════════════════

  public type Vakya = {
    id : Text;
    padas : [Pada];
    kartas : [Text];        // agent organism IDs
    karmas : [Text];        // patient organism IDs  
    timestamp : Int;
    phiWeight : Float;
  };

  stable var vakyaLog : [Vakya] = [];
  transient var vakyaBuffer : Buffer.Buffer<Vakya> = Buffer.Buffer<Vakya>(256);

  // ══════════════════════════════════════════════════════════════════
  //  GRID SIGNAL — Message on the Wire
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
  //  INITIALIZATION — Seed the 10 Core Dhātus
  // ══════════════════════════════════════════════════════════════════

  public func initialize() : async () {
    // भू (bhū) — to be, become — existence operations
    registerDhatu({ id = "भू"; meaning = "to be, become"; gana = 1; pada = "parasmaipada"; phiWeight = PHI3 });
    
    // कृ (kṛ) — to do, make — action operations
    registerDhatu({ id = "कृ"; meaning = "to do, make"; gana = 8; pada = "ubhayapada"; phiWeight = PHI3 });
    
    // गम् (gam) — to go — movement/transfer operations
    registerDhatu({ id = "गम्"; meaning = "to go"; gana = 1; pada = "parasmaipada"; phiWeight = PHI2 });
    
    // स्था (sthā) — to stand — state persistence
    registerDhatu({ id = "स्था"; meaning = "to stand, remain"; gana = 1; pada = "parasmaipada"; phiWeight = PHI2 });
    
    // दा (dā) — to give — transfer/emit operations
    registerDhatu({ id = "दा"; meaning = "to give"; gana = 3; pada = "parasmaipada"; phiWeight = PHI2 });
    
    // ग्रह् (grah) — to grasp — receive/capture operations
    registerDhatu({ id = "ग्रह्"; meaning = "to grasp, receive"; gana = 9; pada = "ubhayapada"; phiWeight = PHI2 });
    
    // वद् (vad) — to speak — communication operations
    registerDhatu({ id = "वद्"; meaning = "to speak"; gana = 1; pada = "parasmaipada"; phiWeight = PHI });
    
    // श्रु (śru) — to hear — listen/receive operations  
    registerDhatu({ id = "श्रु"; meaning = "to hear"; gana = 5; pada = "parasmaipada"; phiWeight = PHI });
    
    // ज्ञा (jñā) — to know — cognition operations
    registerDhatu({ id = "ज्ञा"; meaning = "to know"; gana = 9; pada = "parasmaipada"; phiWeight = PHI3 });
    
    // धृ (dhṛ) — to hold — memory/persistence operations
    registerDhatu({ id = "धृ"; meaning = "to hold, maintain"; gana = 1; pada = "ubhayapada"; phiWeight = PHI2 });
  };

  func registerDhatu(d : Dhatu) : () {
    dhatuMap.put(d.id, d);
  };

  // ══════════════════════════════════════════════════════════════════
  //  SPEAK — Only callable by twin speaker (sanproto_grid)
  // ══════════════════════════════════════════════════════════════════

  public shared(msg) func speak(signal : GridSignal) : async Result.Result<(), Text> {
    if (not isTwinSpeaker(msg.caller)) {
      return #err("Only twin speaker can speak Sanskrit Proto");
    };
    
    signalBuffer.add(signal);
    #ok(())
  };

  // ══════════════════════════════════════════════════════════════════
  //  EMIT — Internal: Generate signal TO grid
  // ══════════════════════════════════════════════════════════════════

  public func emit(dhatu : Text, karaka : Karaka, payload : Text) : async Result.Result<Text, Text> {
    let signal : GridSignal = {
      id = "SIG-" # Nat.toText(signalBuffer.size());
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
