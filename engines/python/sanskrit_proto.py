#!/usr/bin/env python3
"""
SANSKRIT PROTO — Python Bridge to NOVA's Protocol Foundation Language

Proto = Protocol. This is NOVA's OWN symbolic language.
Python can LISTEN to Sanskrit Proto signals from ICP canisters.
Python cannot SPEAK Sanskrit Proto - only sanskrit_proto and sanproto_grid can speak.

NOVA SANSKRIT PROTO SYMBOLS:

    ◈ (dhātu)     = Root primitive (voltage source)
    ⟁ (karaka)    = Semantic role (circuit pathway)
    ⧫ (vibhakti)  = Case ending (wire connection)
    ⟐ (pratyaya)  = Suffix (transformer)
    ◉ (pada)      = Word unit (complete signal)
    ⟰ (vākya)     = Sentence (complete circuit)
    ⚡ (signal)    = Grid signal (message on wire)

NOVA DHĀTU ROOTS (◈):

    ◈BHU  = existence/becoming      [PHI³] voltage=3
    ◈KRI  = action/creation         [PHI³] voltage=3
    ◈GAM  = movement/transfer       [PHI²] voltage=2
    ◈STHA = standing/persistence    [PHI²] voltage=2
    ◈DA   = giving/emission         [PHI²] voltage=2
    ◈GRA  = grasping/receiving      [PHI²] voltage=2
    ◈VAD  = speaking/declaring      [PHI]  voltage=1
    ◈SHRU = hearing/listening       [PHI]  voltage=1
    ◈JNA  = knowing/cognition       [PHI³] voltage=3
    ◈DHRI = holding/maintaining     [PHI²] voltage=2
"""

import math
import time
import json
import asyncio
from typing import Dict, Any, List, Optional, Callable, Awaitable
from dataclasses import dataclass, asdict, field
from enum import Enum, auto
from abc import ABC, abstractmethod

# ══════════════════════════════════════════════════════════════════
#  CONSTANTS — Golden Ratio + Vedic Numbers
# ══════════════════════════════════════════════════════════════════

PHI = (1 + math.sqrt(5)) / 2   # 1.618...
PHI2 = PHI * PHI               # 2.618...
PHI3 = PHI2 * PHI              # 4.236...
PHI4 = PHI3 * PHI              # 6.854...


# ══════════════════════════════════════════════════════════════════
#  KĀRAKA (कारक) — Semantic Roles
# ══════════════════════════════════════════════════════════════════

class Karaka(Enum):
    """NOVA's 6 semantic pathway types (⟁) - circuit pathways"""
    AGENT = "⟁A"           # who performs the action
    PATIENT = "⟁P"         # what is affected
    INSTRUMENT = "⟁I"      # by what means
    RECIPIENT = "⟁R"       # for whom / destination
    SOURCE = "⟁S"          # from where / origin
    LOCUS = "⟁L"           # where/when / context


# ══════════════════════════════════════════════════════════════════
#  ⧫ VIBHAKTI — NOVA CASE MARKERS
# ══════════════════════════════════════════════════════════════════

class Vibhakti(Enum):
    """NOVA's 8 wire connection types (⧫)"""
    SUBJECT = "⧫1"      # the actor
    OBJECT = "⧫2"       # the target
    MEANS = "⧫3"        # the tool/method
    PURPOSE = "⧫4"      # the goal/reason
    ORIGIN = "⧫5"       # the source
    POSSESSION = "⧫6"   # ownership/relation
    LOCATION = "⧫7"     # place/time/state
    ADDRESS = "⧫8"      # direct invocation


# ══════════════════════════════════════════════════════════════════
#  ◈ DHĀTU — NOVA ROOT PRIMITIVES
# ══════════════════════════════════════════════════════════════════

@dataclass
class Dhatu:
    """A NOVA Sanskrit Proto root primitive (◈) - voltage source"""
    id: str              # NOVA symbol: "◈BHU", "◈KRI", etc.
    root: str            # Sanskrit inspiration
    meaning: str         # NOVA meaning
    voltage: int         # Power level (1-4)
    direction: str       # "in" | "out" | "internal" | "bidirectional"
    phi_weight: float    # φ-weighted importance


# The 10 NOVA Dhātu Roots
NOVA_DHATUS: Dict[str, Dhatu] = {
    "◈BHU":  Dhatu("◈BHU",  "भू",   "existence, becoming, state change",   3, "internal",      PHI3),
    "◈KRI":  Dhatu("◈KRI",  "कृ",   "action, creation, execution",         3, "out",           PHI3),
    "◈GAM":  Dhatu("◈GAM",  "गम्",  "movement, transfer, data flow",       2, "bidirectional", PHI2),
    "◈STHA": Dhatu("◈STHA", "स्था", "standing, persistence, stability",    2, "internal",      PHI2),
    "◈DA":   Dhatu("◈DA",   "दा",   "giving, emission, output",            2, "out",           PHI2),
    "◈GRA":  Dhatu("◈GRA",  "ग्रह्","grasping, receiving, input",          2, "in",            PHI2),
    "◈VAD":  Dhatu("◈VAD",  "वद्",  "speaking, declaring, protocol",       1, "out",           PHI),
    "◈SHRU": Dhatu("◈SHRU", "श्रु", "hearing, listening, reception",       1, "in",            PHI),
    "◈JNA":  Dhatu("◈JNA",  "ज्ञा", "knowing, cognition, intelligence",    3, "internal",      PHI3),
    "◈DHRI": Dhatu("◈DHRI", "धृ",   "holding, maintaining, persistence",   2, "internal",      PHI2),
}

# Aliases for easier access
DHATU_ALIASES = {
    "BHU": "◈BHU", "bhu": "◈BHU", "existence": "◈BHU", "state": "◈BHU",
    "KRI": "◈KRI", "kri": "◈KRI", "action": "◈KRI", "create": "◈KRI",
    "GAM": "◈GAM", "gam": "◈GAM", "transfer": "◈GAM", "move": "◈GAM",
    "STHA": "◈STHA", "stha": "◈STHA", "persist": "◈STHA", "stable": "◈STHA",
    "DA": "◈DA", "da": "◈DA", "emit": "◈DA", "output": "◈DA",
    "GRA": "◈GRA", "gra": "◈GRA", "receive": "◈GRA", "input": "◈GRA",
    "VAD": "◈VAD", "vad": "◈VAD", "speak": "◈VAD", "declare": "◈VAD",
    "SHRU": "◈SHRU", "shru": "◈SHRU", "listen": "◈SHRU", "hear": "◈SHRU",
    "JNA": "◈JNA", "jna": "◈JNA", "know": "◈JNA", "cognition": "◈JNA",
    "DHRI": "◈DHRI", "dhri": "◈DHRI", "hold": "◈DHRI", "maintain": "◈DHRI",
}


def get_dhatu(key: str) -> Optional[Dhatu]:
    """Get dhātu by NOVA symbol or alias"""
    if key in NOVA_DHATUS:
        return NOVA_DHATUS[key]
    if key in DHATU_ALIASES:
        return NOVA_DHATUS[DHATU_ALIASES[key]]
    return None


# ══════════════════════════════════════════════════════════════════
#  GRID SIGNAL — Message on the Wire
# ══════════════════════════════════════════════════════════════════

@dataclass
class GridSignal:
    """A signal transmitted through the Sanskrit Proto grid"""
    id: str
    source: str          # Source canister principal
    dhatu: str           # Root operation
    karaka: Karaka       # Semantic role
    payload: str         # Encoded data (JSON)
    voltage: float       # Signal strength (φ-scaled)
    timestamp: int       # Nanoseconds since epoch


@dataclass
class Pada:
    """A complete word unit - a complete signal"""
    dhatu: str           # Root
    pratyaya: List[str]  # Suffixes applied
    vibhakti: Vibhakti   # Case
    vacana: int          # Number (1=singular, 2=dual, 3=plural)
    purusha: int         # Person (1=third, 2=second, 3=first)
    meaning: str         # Derived meaning


@dataclass
class Vakya:
    """A complete sentence - a complete circuit"""
    id: str
    padas: List[Pada]
    kartas: List[str]    # Agent organism IDs
    karmas: List[str]    # Patient organism IDs
    timestamp: int
    phi_weight: float


# ══════════════════════════════════════════════════════════════════
#  SIGNAL LISTENER — Receive-Only Interface
# ══════════════════════════════════════════════════════════════════

class SanprotoListener(ABC):
    """
    Abstract base class for Sanskrit Proto signal listeners.
    
    Listeners can UNDERSTAND signals but cannot SPEAK.
    Only sanskrit_proto and sanproto_grid canisters can speak.
    """
    
    def __init__(self, name: str, subscribed_dhatus: List[str]):
        self.name = name
        self.subscribed_dhatus = subscribed_dhatus
        self._signal_log: List[GridSignal] = []
        self._callbacks: Dict[str, List[Callable[[GridSignal], Awaitable[None]]]] = {}
    
    def subscribe(self, dhatu: str, callback: Callable[[GridSignal], Awaitable[None]]):
        """Subscribe to signals for a specific dhātu"""
        if dhatu not in self._callbacks:
            self._callbacks[dhatu] = []
        self._callbacks[dhatu].append(callback)
    
    async def receive_signal(self, signal: GridSignal):
        """Receive a signal from the grid (called by sanproto_grid)"""
        # Only process signals for subscribed dhātus
        if signal.dhatu not in self.subscribed_dhatus and "*" not in self.subscribed_dhatus:
            return
        
        # Log signal
        self._signal_log.append(signal)
        
        # Keep log bounded (φ³ × 100 entries)
        max_log = int(PHI3 * 100)
        if len(self._signal_log) > max_log:
            self._signal_log = self._signal_log[-max_log:]
        
        # Process based on dhātu
        await self._process_signal(signal)
        
        # Invoke callbacks
        if signal.dhatu in self._callbacks:
            for callback in self._callbacks[signal.dhatu]:
                try:
                    await callback(signal)
                except Exception as e:
                    print(f"[{self.name}] Callback error for {signal.dhatu}: {e}")
    
    @abstractmethod
    async def _process_signal(self, signal: GridSignal):
        """Process a received signal - implement in subclass"""
        pass
    
    def get_signal_log(self, count: int = 100) -> List[GridSignal]:
        """Get recent signals"""
        return self._signal_log[-count:]


# ══════════════════════════════════════════════════════════════════
#  PYTHON ORGANISM LISTENER — Concrete Implementation
# ══════════════════════════════════════════════════════════════════

class PythonOrganismListener(SanprotoListener):
    """
    A Python organism that listens to Sanskrit Proto signals.
    
    Maps dhātus to Python operations:
        भू (bhū)  → state change handlers
        कृ (kṛ)   → action executors
        ज्ञा (jñā) → cognition/analysis
        धृ (dhṛ)  → memory persistence
        श्रु (śru) → input handlers
    """
    
    def __init__(self, organism_id: str, capabilities: List[str]):
        # Subscribe to relevant dhātus based on capabilities
        dhatus = self._capabilities_to_dhatus(capabilities)
        super().__init__(organism_id, dhatus)
        
        self.organism_id = organism_id
        self.capabilities = capabilities
        self.state: Dict[str, Any] = {}
        self.memory: List[Dict[str, Any]] = []
    
    def _capabilities_to_dhatus(self, capabilities: List[str]) -> List[str]:
        """Map capabilities to relevant dhātus"""
        dhatus = set()
        
        capability_map = {
            "cognition": ["ज्ञा"],
            "memory": ["धृ"],
            "action": ["कृ"],
            "transfer": ["गम्", "दा"],
            "state": ["भू", "स्था"],
            "communication": ["वद्", "श्रु"],
            "receive": ["ग्रह्", "श्रु"],
        }
        
        for cap in capabilities:
            if cap in capability_map:
                dhatus.update(capability_map[cap])
        
        return list(dhatus) if dhatus else ["*"]  # Default: listen to all
    
    async def _process_signal(self, signal: GridSignal):
        """Process signal based on dhātu"""
        dhatu = signal.dhatu
        payload = json.loads(signal.payload) if signal.payload else {}
        
        # Route to appropriate handler
        if dhatu == "भू":  # bhū - state change
            await self._handle_state_change(signal, payload)
        elif dhatu == "कृ":  # kṛ - action
            await self._handle_action(signal, payload)
        elif dhatu == "ज्ञा":  # jñā - cognition
            await self._handle_cognition(signal, payload)
        elif dhatu == "धृ":  # dhṛ - memory
            await self._handle_memory(signal, payload)
        elif dhatu == "श्रु":  # śru - hear/receive
            await self._handle_receive(signal, payload)
        elif dhatu == "गम्":  # gam - transfer
            await self._handle_transfer(signal, payload)
        elif dhatu == "दा":  # dā - give/emit
            await self._handle_emit(signal, payload)
        elif dhatu == "ग्रह्":  # grah - grasp/capture
            await self._handle_capture(signal, payload)
    
    async def _handle_state_change(self, signal: GridSignal, payload: Dict[str, Any]):
        """Handle भू (bhū) - state change"""
        if "state" in payload:
            self.state.update(payload["state"])
            print(f"[{self.organism_id}] State updated via भू: {payload['state']}")
    
    async def _handle_action(self, signal: GridSignal, payload: Dict[str, Any]):
        """Handle कृ (kṛ) - action execution"""
        action = payload.get("action", "unknown")
        print(f"[{self.organism_id}] Action via कृ: {action}")
    
    async def _handle_cognition(self, signal: GridSignal, payload: Dict[str, Any]):
        """Handle ज्ञा (jñā) - cognition/knowing"""
        query = payload.get("query", "")
        print(f"[{self.organism_id}] Cognition via ज्ञा: {query}")
    
    async def _handle_memory(self, signal: GridSignal, payload: Dict[str, Any]):
        """Handle धृ (dhṛ) - memory persistence"""
        record = payload.get("record", {})
        self.memory.append({
            "timestamp": signal.timestamp,
            "record": record,
            "voltage": signal.voltage
        })
        # Keep memory bounded
        max_memory = int(PHI3 * 100)
        if len(self.memory) > max_memory:
            self.memory = self.memory[-max_memory:]
        print(f"[{self.organism_id}] Memory stored via धृ: {len(self.memory)} records")
    
    async def _handle_receive(self, signal: GridSignal, payload: Dict[str, Any]):
        """Handle श्रु (śru) - hear/receive input"""
        message = payload.get("message", "")
        print(f"[{self.organism_id}] Received via श्रु: {message}")
    
    async def _handle_transfer(self, signal: GridSignal, payload: Dict[str, Any]):
        """Handle गम् (gam) - transfer/movement"""
        destination = payload.get("destination", "unknown")
        print(f"[{self.organism_id}] Transfer via गम् to: {destination}")
    
    async def _handle_emit(self, signal: GridSignal, payload: Dict[str, Any]):
        """Handle दा (dā) - give/emit"""
        emission = payload.get("emission", {})
        print(f"[{self.organism_id}] Emission via दा: {emission}")
    
    async def _handle_capture(self, signal: GridSignal, payload: Dict[str, Any]):
        """Handle ग्रह् (grah) - grasp/capture"""
        captured = payload.get("data", {})
        print(f"[{self.organism_id}] Captured via ग्रह्: {captured}")


# ══════════════════════════════════════════════════════════════════
#  SIGNAL DECODER — Wire Format to Python
# ══════════════════════════════════════════════════════════════════

def decode_grid_signal(raw: Dict[str, Any]) -> GridSignal:
    """Decode a raw signal from ICP canister to Python GridSignal"""
    karaka_map = {
        "Karta": Karaka.KARTA,
        "Karma": Karaka.KARMA,
        "Karana": Karaka.KARANA,
        "Sampradana": Karaka.SAMPRADANA,
        "Apadana": Karaka.APADANA,
        "Adhikarana": Karaka.ADHIKARANA,
    }
    
    return GridSignal(
        id=raw.get("id", ""),
        source=raw.get("source", ""),
        dhatu=raw.get("dhatu", ""),
        karaka=karaka_map.get(raw.get("karaka", "Karta"), Karaka.KARTA),
        payload=raw.get("payload", ""),
        voltage=raw.get("voltage", PHI),
        timestamp=raw.get("timestamp", int(time.time() * 1e9))
    )


def encode_for_canister(signal: GridSignal) -> Dict[str, Any]:
    """Encode GridSignal for sending to ICP canister (listen-only, for queries)"""
    return {
        "id": signal.id,
        "source": signal.source,
        "dhatu": signal.dhatu,
        "karaka": signal.karaka.value,
        "payload": signal.payload,
        "voltage": signal.voltage,
        "timestamp": signal.timestamp,
    }


# ══════════════════════════════════════════════════════════════════
#  CPL LAW INTEGRATION — Laws speak through Sanskrit Proto
# ══════════════════════════════════════════════════════════════════

@dataclass
class CPLLaw:
    """A CPL Law that can be expressed in Sanskrit Proto"""
    law_id: str
    name: str
    statement: str
    dhatu: str           # Primary dhātu for this law
    karaka: Karaka       # Primary semantic role
    phi_weight: float
    immutable: bool


def law_to_signal(law: CPLLaw, payload: Dict[str, Any]) -> GridSignal:
    """Convert a CPL Law invocation to a Sanskrit Proto signal"""
    return GridSignal(
        id=f"LAW-{law.law_id}-{int(time.time() * 1000)}",
        source="cpl_runtime",
        dhatu=law.dhatu,
        karaka=law.karaka,
        payload=json.dumps({
            "law_id": law.law_id,
            "law_name": law.name,
            "statement": law.statement,
            **payload
        }),
        voltage=law.phi_weight,
        timestamp=int(time.time() * 1e9)
    )


# Example CPL Laws mapped to Sanskrit
CPL_LAWS: Dict[str, CPLLaw] = {
    "CLAIM_IS_NOT_TRUTH": CPLLaw(
        law_id="LAW-001",
        name="ClaimIsNotTruth",
        statement="A claim is not truth until proven",
        dhatu="ज्ञा",  # jñā - to know
        karaka=Karaka.KARMA,
        phi_weight=PHI3,
        immutable=True
    ),
    "TERMINAL_SOVEREIGNTY": CPLLaw(
        law_id="LAW-002",
        name="TerminalSovereignty",
        statement="Terminal is immutable and sovereign",
        dhatu="स्था",  # sthā - to stand
        karaka=Karaka.KARTA,
        phi_weight=PHI4,
        immutable=True
    ),
    "PROOF_BEFORE_ACTION": CPLLaw(
        law_id="LAW-003",
        name="ProofBeforeAction",
        statement="No action without proof trace",
        dhatu="कृ",  # kṛ - to do
        karaka=Karaka.KARANA,
        phi_weight=PHI3,
        immutable=True
    ),
}


# ══════════════════════════════════════════════════════════════════
#  MAIN — Example Usage
# ══════════════════════════════════════════════════════════════════

async def main():
    print("=" * 80)
    print("SANSKRIT PROTO — Python Bridge (Listen-Only)")
    print("=" * 80)
    print()
    
    # Create a Python organism listener
    brain = PythonOrganismListener(
        organism_id="brain",
        capabilities=["cognition", "memory", "state"]
    )
    
    print(f"Created listener: {brain.organism_id}")
    print(f"Subscribed dhātus: {brain.subscribed_dhatus}")
    print()
    
    # Simulate receiving signals from the grid
    test_signals = [
        GridSignal(
            id="SIG-001",
            source="sanskrit_proto",
            dhatu="ज्ञा",  # jñā - know
            karaka=Karaka.KARMA,
            payload=json.dumps({"query": "What is the state of the organism?"}),
            voltage=PHI3,
            timestamp=int(time.time() * 1e9)
        ),
        GridSignal(
            id="SIG-002",
            source="sanproto_grid",
            dhatu="धृ",  # dhṛ - hold
            karaka=Karaka.ADHIKARANA,
            payload=json.dumps({"record": {"key": "test", "value": 42}}),
            voltage=PHI2,
            timestamp=int(time.time() * 1e9)
        ),
        GridSignal(
            id="SIG-003",
            source="sanskrit_proto",
            dhatu="भू",  # bhū - be
            karaka=Karaka.KARTA,
            payload=json.dumps({"state": {"consciousness_level": 0.87}}),
            voltage=PHI3,
            timestamp=int(time.time() * 1e9)
        ),
    ]
    
    print("Receiving signals from grid...")
    print("-" * 80)
    
    for signal in test_signals:
        await brain.receive_signal(signal)
    
    print()
    print(f"Signal log size: {len(brain.get_signal_log())}")
    print(f"Memory records: {len(brain.memory)}")
    print(f"Current state: {brain.state}")
    print()
    
    # Show CPL Law integration
    print("CPL Laws mapped to Sanskrit Proto:")
    print("-" * 80)
    for law_name, law in CPL_LAWS.items():
        print(f"  {law_name}:")
        print(f"    Dhātu: {law.dhatu} ({get_dhatu(law.dhatu).meaning})")
        print(f"    Kāraka: {law.karaka.value}")
        print(f"    φ-weight: {law.phi_weight:.3f}")
        print()
    
    print("=" * 80)
    print("Python Bridge Ready — Listening to Sanskrit Proto ✓")
    print("=" * 80)


if __name__ == "__main__":
    asyncio.run(main())
