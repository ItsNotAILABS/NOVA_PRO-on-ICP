"""
NOVA Network Intelligence Suite (NNIS) — Python SDK

Casa de Medina — Architectos de Architectura Inteligente

Fully-typed, deep network intelligence library implementing:
  - MeshWeaver: Topology optimization via Kuramoto synchronization
  - Spectrion: Shannon-capacity spectrum management
  - SignalForge: Fourier/wavelet signal processing
  - Resiliex: Fault-tolerance & self-healing networks
  - QuantumLattice: QKD & quantum channel management
  - NetMind: Adaptive routing & traffic intelligence

IP Portfolio: NNIS-2026-MEDINA
"""

from __future__ import annotations

import math
import time
from dataclasses import dataclass, field
from enum import Enum
from typing import Final, Literal, Optional, Sequence

# ═══════════════════════════════════════════════════════════════════════════════
# MATHEMATICAL CONSTANTS
# ═══════════════════════════════════════════════════════════════════════════════

PHI: Final[float] = 1.6180339887498949
PHI_SQUARED: Final[float] = PHI * PHI
PHI_INVERSE: Final[float] = 1.0 / PHI
PHI_CUBED: Final[float] = PHI * PHI * PHI
GOLDEN_ANGLE: Final[float] = 2 * math.pi * (1 - 1 / PHI)
LOG2_E: Final[float] = math.log2(math.e)
PLANCK: Final[float] = 6.62607015e-34
BOLTZMANN: Final[float] = 1.380649e-23

FIBONACCI_RETRY_MS: Final[tuple[int, ...]] = (
    100, 100, 200, 300, 500, 800, 1300, 2100, 3400, 5500, 8900
)

FIBONACCI_SCALE: Final[tuple[int, ...]] = (
    1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144
)


# ═══════════════════════════════════════════════════════════════════════════════
# CORE TYPES
# ═══════════════════════════════════════════════════════════════════════════════


class HealthStatus(Enum):
    """Network component health status."""
    HEALTHY = "HEALTHY"
    DEGRADED = "DEGRADED"
    CRITICAL = "CRITICAL"
    NO_NODES = "NO_NODES"


class FaultType(Enum):
    """Types of network faults."""
    NODE_FAILURE = "NODE_FAILURE"
    LINK_FAILURE = "LINK_FAILURE"
    CONGESTION = "CONGESTION"
    BYZANTINE = "BYZANTINE"
    PARTITION = "PARTITION"


class ModulationType(Enum):
    """OFDM modulation schemes."""
    BPSK = "BPSK"
    QPSK = "QPSK"
    QAM16 = "16QAM"
    QAM64 = "64QAM"
    QAM256 = "256QAM"
    QAM1024 = "1024QAM"


class QKDProtocol(Enum):
    """Quantum Key Distribution protocols."""
    BB84 = "BB84"
    E91 = "E91"
    B92 = "B92"
    SARG04 = "SARG04"
    DPS = "DPS"


class QoSClass(Enum):
    """Quality of Service classifications."""
    REALTIME = "REALTIME"
    INTERACTIVE = "INTERACTIVE"
    BULK = "BULK"
    BEST_EFFORT = "BEST_EFFORT"


class FilterType(Enum):
    """Signal filter types."""
    LOWPASS = "lowpass"
    HIGHPASS = "highpass"
    BANDPASS = "bandpass"
    BANDSTOP = "bandstop"


class TrendDirection(Enum):
    """Traffic trend direction."""
    INCREASING = "INCREASING"
    DECREASING = "DECREASING"
    STABLE = "STABLE"
    OSCILLATING = "OSCILLATING"


class CircuitState(Enum):
    """Circuit breaker state."""
    CLOSED = "CLOSED"
    OPEN = "OPEN"
    HALF_OPEN = "HALF_OPEN"


# ─── Data Models ──────────────────────────────────────────────────────────────


@dataclass(frozen=True)
class Vector3D:
    """3D position vector."""
    x: float
    y: float
    z: float


@dataclass(frozen=True)
class NetworkNode:
    """A node in the network graph."""
    id: str
    priority: int
    capacity: float = 0.0
    position: Optional[Vector3D] = None
    metadata: dict[str, object] = field(default_factory=dict)


@dataclass(frozen=True)
class NetworkEdge:
    """An edge in the network graph."""
    source: str
    target: str
    weight: float = 1.0
    latency: float = 0.0
    bandwidth: float = 0.0


@dataclass(frozen=True)
class NetworkHealthThresholds:
    """Kuramoto-derived health thresholds."""
    healthy: float = PHI_INVERSE
    degraded_min: float = 0.382
    critical_max: float = 0.382


NETWORK_HEALTH: Final[NetworkHealthThresholds] = NetworkHealthThresholds()


# ═══════════════════════════════════════════════════════════════════════════════
# MESHWEAVER ENGINE — Topology & Synchronization
# ═══════════════════════════════════════════════════════════════════════════════


@dataclass(frozen=True)
class KuramotoResult:
    """Result of Kuramoto coherence analysis."""
    order_parameter: float
    collective_phase: float
    node_count: int
    status: HealthStatus
    thresholds: NetworkHealthThresholds
    phase_variance: float
    entropy_bits: float
    formula: str
    timestamp: float


@dataclass(frozen=True)
class LoadDistribution:
    """Load distribution for a single node."""
    node_id: str
    priority: int
    phi_weight: float
    allocated_traffic: float
    load_percentage: float
    capacity_utilization: float
    formula: str


@dataclass(frozen=True)
class TopologyMetrics:
    """Full topology analysis result."""
    node_count: int
    edge_count: int
    average_degree: float
    density: float
    clustering_coefficient: float
    phi_efficiency: float
    diameter: int
    is_connected: bool
    spectral_gap: float
    formula: str
    timestamp: float


@dataclass(frozen=True)
class ShortestPathResult:
    """Dijkstra shortest path result."""
    path: list[str]
    distance: float
    hops: int
    phi_cost: float


@dataclass(frozen=True)
class SpanningTreeResult:
    """Minimum spanning tree result."""
    edges: list[NetworkEdge]
    total_weight: float
    phi_optimal_weight: float
    timestamp: float


class MeshWeaverEngine:
    """Network Topology Intelligence — Kuramoto synchronization & graph algorithms."""

    ENGINE_ID: Final[str] = "MESHWEAVER"
    VERSION: Final[str] = "1.618.0"

    def calculate_kuramoto_coherence(self, node_phases: Sequence[float]) -> KuramotoResult:
        """
        Kuramoto Order Parameter: R·e^(iΨ) = (1/N)·Σe^(iθⱼ)

        Extended with phase variance and Shannon entropy.
        """
        n = len(node_phases)
        if n == 0:
            return KuramotoResult(
                order_parameter=0.0,
                collective_phase=0.0,
                node_count=0,
                status=HealthStatus.NO_NODES,
                thresholds=NETWORK_HEALTH,
                phase_variance=0.0,
                entropy_bits=0.0,
                formula="R·e^(iΨ) = (1/N)·Σe^(iθⱼ) (Kuramoto)",
                timestamp=time.time(),
            )

        sum_real = sum(math.cos(p) for p in node_phases)
        sum_imag = sum(math.sin(p) for p in node_phases)
        avg_real = sum_real / n
        avg_imag = sum_imag / n
        r = math.sqrt(avg_real**2 + avg_imag**2)
        psi = math.atan2(avg_imag, avg_real)

        phase_variance = 1.0 - r

        # Shannon entropy of phase distribution
        bins = max(4, int(math.sqrt(n)))
        histogram = [0] * bins
        for phase in node_phases:
            normalised = phase % (2 * math.pi)
            if normalised < 0:
                normalised += 2 * math.pi
            bin_idx = min(bins - 1, int((normalised / (2 * math.pi)) * bins))
            histogram[bin_idx] += 1

        entropy = 0.0
        for count in histogram:
            if count > 0:
                p = count / n
                entropy -= p * math.log2(p)

        if r >= NETWORK_HEALTH.healthy:
            status = HealthStatus.HEALTHY
        elif r >= NETWORK_HEALTH.degraded_min:
            status = HealthStatus.DEGRADED
        else:
            status = HealthStatus.CRITICAL

        return KuramotoResult(
            order_parameter=r,
            collective_phase=psi,
            node_count=n,
            status=status,
            thresholds=NETWORK_HEALTH,
            phase_variance=phase_variance,
            entropy_bits=entropy,
            formula="R·e^(iΨ) = (1/N)·Σe^(iθⱼ) (Kuramoto)",
            timestamp=time.time(),
        )

    def distribute_load(
        self, total_traffic: float, nodes: Sequence[NetworkNode]
    ) -> list[LoadDistribution]:
        """
        φ-Weighted Load Distribution.
        Load(node_i) = TotalTraffic × (φ^(-priority_i) / Σφ^(-priority_j))
        """
        weights = [(node, PHI ** (-node.priority)) for node in nodes]
        total_weight = sum(w for _, w in weights)

        results: list[LoadDistribution] = []
        for node, phi_w in weights:
            allocated = total_traffic * (phi_w / total_weight) if total_weight > 0 else 0.0
            cap_util = allocated / node.capacity if node.capacity > 0 else 0.0
            results.append(LoadDistribution(
                node_id=node.id,
                priority=node.priority,
                phi_weight=phi_w,
                allocated_traffic=allocated,
                load_percentage=(phi_w / total_weight * 100) if total_weight > 0 else 0.0,
                capacity_utilization=cap_util,
                formula="Load(i) = Total × (φ^(-p_i) / Σφ^(-p_j))",
            ))
        return results

    def analyze_topology(
        self, nodes: Sequence[NetworkNode], edges: Sequence[NetworkEdge]
    ) -> TopologyMetrics:
        """Full topology analysis with spectral gap estimation."""
        n = len(nodes)
        e = len(edges)
        if n == 0:
            return TopologyMetrics(
                node_count=0, edge_count=0, average_degree=0.0,
                density=0.0, clustering_coefficient=0.0, phi_efficiency=0.0,
                diameter=0, is_connected=False, spectral_gap=0.0,
                formula="Efficiency = φ⁻¹ + (1-φ⁻¹) × (deg/20)",
                timestamp=time.time(),
            )

        avg_degree = (2 * e) / n
        density = (2 * e) / (n * (n - 1)) if n > 1 else 0.0
        clustering = min(1.0, (avg_degree / n) * PHI_INVERSE)
        efficiency = min(1.0, PHI_INVERSE + (1 - PHI_INVERSE) * (avg_degree / 20))
        diameter = math.ceil(math.log(n) / math.log(avg_degree)) if avg_degree > 1 else n
        spectral_gap = density * PHI_INVERSE
        is_connected = self._check_connectivity(nodes, edges)

        return TopologyMetrics(
            node_count=n, edge_count=e, average_degree=avg_degree,
            density=density, clustering_coefficient=clustering,
            phi_efficiency=efficiency, diameter=diameter,
            is_connected=is_connected, spectral_gap=spectral_gap,
            formula="Efficiency = φ⁻¹ + (1-φ⁻¹) × (deg/20)",
            timestamp=time.time(),
        )

    def shortest_path(
        self,
        nodes: Sequence[NetworkNode],
        edges: Sequence[NetworkEdge],
        source: str,
        target: str,
    ) -> Optional[ShortestPathResult]:
        """Dijkstra shortest path with φ-cost adjustment."""
        adj: dict[str, list[tuple[str, float]]] = {node.id: [] for node in nodes}
        for edge in edges:
            adj[edge.source].append((edge.target, edge.weight))
            adj[edge.target].append((edge.source, edge.weight))

        dist: dict[str, float] = {node.id: math.inf for node in nodes}
        prev: dict[str, Optional[str]] = {node.id: None for node in nodes}
        visited: set[str] = set()
        dist[source] = 0.0

        while True:
            min_node: Optional[str] = None
            min_dist = math.inf
            for nid, d in dist.items():
                if nid not in visited and d < min_dist:
                    min_dist = d
                    min_node = nid
            if min_node is None or min_node == target:
                break
            visited.add(min_node)
            for neighbor, weight in adj.get(min_node, []):
                alt = min_dist + weight
                if alt < dist[neighbor]:
                    dist[neighbor] = alt
                    prev[neighbor] = min_node

        if dist[target] == math.inf:
            return None

        path: list[str] = []
        current: Optional[str] = target
        while current is not None:
            path.insert(0, current)
            current = prev[current]

        return ShortestPathResult(
            path=path,
            distance=dist[target],
            hops=len(path) - 1,
            phi_cost=dist[target] * PHI_INVERSE,
        )

    def minimum_spanning_tree(
        self, nodes: Sequence[NetworkNode], edges: Sequence[NetworkEdge]
    ) -> SpanningTreeResult:
        """Kruskal's minimum spanning tree."""
        parent: dict[str, str] = {n.id: n.id for n in nodes}
        rank: dict[str, int] = {n.id: 0 for n in nodes}

        def find(x: str) -> str:
            if parent[x] != x:
                parent[x] = find(parent[x])
            return parent[x]

        def union(a: str, b: str) -> bool:
            ra, rb = find(a), find(b)
            if ra == rb:
                return False
            if rank[ra] < rank[rb]:
                parent[ra] = rb
            elif rank[ra] > rank[rb]:
                parent[rb] = ra
            else:
                parent[rb] = ra
                rank[ra] += 1
            return True

        sorted_edges = sorted(edges, key=lambda e: e.weight)
        mst_edges: list[NetworkEdge] = []
        total_weight = 0.0

        for edge in sorted_edges:
            if union(edge.source, edge.target):
                mst_edges.append(edge)
                total_weight += edge.weight

        return SpanningTreeResult(
            edges=mst_edges,
            total_weight=total_weight,
            phi_optimal_weight=total_weight * PHI_INVERSE,
            timestamp=time.time(),
        )

    def _check_connectivity(
        self, nodes: Sequence[NetworkNode], edges: Sequence[NetworkEdge]
    ) -> bool:
        if not nodes:
            return False
        adj: dict[str, list[str]] = {n.id: [] for n in nodes}
        for edge in edges:
            adj[edge.source].append(edge.target)
            adj[edge.target].append(edge.source)
        visited: set[str] = set()
        queue = [nodes[0].id]
        visited.add(nodes[0].id)
        while queue:
            curr = queue.pop(0)
            for neighbor in adj.get(curr, []):
                if neighbor not in visited:
                    visited.add(neighbor)
                    queue.append(neighbor)
        return len(visited) == len(nodes)


# ═══════════════════════════════════════════════════════════════════════════════
# SPECTRION ENGINE — Spectrum & Channel Intelligence
# ═══════════════════════════════════════════════════════════════════════════════


@dataclass(frozen=True)
class ChannelCapacity:
    """Shannon channel capacity result."""
    bandwidth: float
    snr: float
    snr_db: float
    capacity: float
    spectral_efficiency: float
    waterfill_level: float
    formula: str
    timestamp: float


@dataclass(frozen=True)
class SpectrumAllocation:
    """Individual user spectrum allocation."""
    user_id: int
    bandwidth: float
    phi_weight: float
    center_frequency: float
    snr_estimate: float


@dataclass(frozen=True)
class SpectrumPartition:
    """Full spectrum partitioning result."""
    total_bandwidth: float
    allocations: list[SpectrumAllocation]
    efficiency: float
    utilization_ratio: float
    formula: str
    timestamp: float


@dataclass(frozen=True)
class OFDMSubcarrier:
    """Single OFDM subcarrier."""
    index: int
    frequency: float
    power: float
    modulation: ModulationType
    bits_per_symbol: int


@dataclass(frozen=True)
class OFDMResult:
    """OFDM allocation result."""
    subcarriers: list[OFDMSubcarrier]
    total_capacity: float
    average_bits_per_symbol: float
    peak_to_average_ratio: float
    formula: str
    timestamp: float


class SpectrionEngine:
    """Spectrum Management Intelligence — Shannon capacity & OFDM allocation."""

    ENGINE_ID: Final[str] = "SPECTRION"
    VERSION: Final[str] = "1.618.0"

    def calculate_channel_capacity(
        self,
        bandwidth: float,
        signal_power_dbm: float,
        noise_power_dbm: float,
    ) -> ChannelCapacity:
        """Shannon Channel Capacity: C = B × log₂(1 + SNR)."""
        signal_linear = 10 ** (signal_power_dbm / 10)
        noise_linear = 10 ** (noise_power_dbm / 10)
        snr = signal_linear / noise_linear
        capacity = bandwidth * math.log2(1 + snr)
        waterfill_level = noise_linear + signal_linear

        return ChannelCapacity(
            bandwidth=bandwidth,
            snr=snr,
            snr_db=10 * math.log10(snr),
            capacity=capacity,
            spectral_efficiency=capacity / bandwidth if bandwidth > 0 else 0.0,
            waterfill_level=waterfill_level,
            formula="C = B × log₂(1 + SNR) (Shannon)",
            timestamp=time.time(),
        )

    def partition_spectrum(
        self,
        total_bandwidth: float,
        user_count: int,
        base_snr: float = 20.0,
    ) -> SpectrumPartition:
        """φ-Ratio Spectrum Partitioning."""
        allocations: list[SpectrumAllocation] = []
        remaining = total_bandwidth
        total_allocated = 0.0

        for i in range(user_count):
            phi_weight = PHI ** (-i)
            allocation = remaining * PHI_INVERSE
            remaining -= allocation
            total_allocated += allocation
            allocations.append(SpectrumAllocation(
                user_id=i,
                bandwidth=allocation,
                phi_weight=phi_weight,
                center_frequency=total_bandwidth - remaining - allocation / 2,
                snr_estimate=base_snr - i * 3,
            ))

        return SpectrumPartition(
            total_bandwidth=total_bandwidth,
            allocations=allocations,
            efficiency=total_allocated / total_bandwidth if total_bandwidth > 0 else 0.0,
            utilization_ratio=total_allocated / (total_bandwidth * PHI_INVERSE) if total_bandwidth > 0 else 0.0,
            formula="Alloc(i) = Remaining × φ⁻¹; SNR(i) = base - 3i dB",
            timestamp=time.time(),
        )

    def allocate_ofdm(
        self,
        total_bandwidth: float,
        subcarrier_count: int,
        channel_gains: Sequence[float],
        noise_power: float,
    ) -> OFDMResult:
        """Adaptive OFDM subcarrier allocation with modulation selection."""
        spacing = total_bandwidth / subcarrier_count
        subcarriers: list[OFDMSubcarrier] = []
        total_capacity = 0.0
        total_bits = 0
        max_power = 0.0
        avg_power = 0.0

        for i in range(subcarrier_count):
            gain = channel_gains[i % len(channel_gains)]
            snr = gain / noise_power if noise_power > 0 else 0
            power = gain * PHI_INVERSE
            bits = max(1, int(math.log2(1 + snr))) if snr > 0 else 1
            modulation = self._select_modulation(bits)

            subcarriers.append(OFDMSubcarrier(
                index=i,
                frequency=i * spacing,
                power=power,
                modulation=modulation,
                bits_per_symbol=bits,
            ))
            total_capacity += spacing * math.log2(1 + snr) if snr > 0 else 0
            total_bits += bits
            max_power = max(max_power, power)
            avg_power += power

        avg_power /= max(1, subcarrier_count)

        return OFDMResult(
            subcarriers=subcarriers,
            total_capacity=total_capacity,
            average_bits_per_symbol=total_bits / max(1, subcarrier_count),
            peak_to_average_ratio=max_power / avg_power if avg_power > 0 else 0.0,
            formula="OFDM: C_total = Σ Δf × log₂(1 + SNR_k)",
            timestamp=time.time(),
        )

    @staticmethod
    def _select_modulation(bits_per_symbol: int) -> ModulationType:
        if bits_per_symbol >= 10:
            return ModulationType.QAM1024
        if bits_per_symbol >= 8:
            return ModulationType.QAM256
        if bits_per_symbol >= 6:
            return ModulationType.QAM64
        if bits_per_symbol >= 4:
            return ModulationType.QAM16
        if bits_per_symbol >= 2:
            return ModulationType.QPSK
        return ModulationType.BPSK


# ═══════════════════════════════════════════════════════════════════════════════
# SIGNALFORGE ENGINE — Signal Processing Intelligence
# ═══════════════════════════════════════════════════════════════════════════════


@dataclass(frozen=True)
class FrequencyBin:
    """FFT frequency bin."""
    frequency: float
    magnitude: float
    phase: float
    power: float


@dataclass(frozen=True)
class FFTResult:
    """FFT analysis result."""
    bins: list[FrequencyBin]
    dominant_frequency: float
    total_power: float
    spectral_flatness: float
    sample_rate: float
    formula: str
    timestamp: float


@dataclass(frozen=True)
class FilterCoefficients:
    """IIR filter coefficients."""
    numerator: list[float]
    denominator: list[float]
    order: int
    cutoff_frequency: float
    filter_type: FilterType


@dataclass(frozen=True)
class AutocorrelationResult:
    """Autocorrelation analysis result."""
    values: list[float]
    peak_lag: int
    periodicity: int
    confidence: float
    formula: str
    timestamp: float


@dataclass(frozen=True)
class ConvolutionResult:
    """Convolution result with φ-normalisation."""
    output: list[float]
    length: int
    phi_normalization_factor: float
    formula: str


class SignalForgeEngine:
    """Signal Processing Intelligence — FFT, filtering, autocorrelation."""

    ENGINE_ID: Final[str] = "SIGNALFORGE"
    VERSION: Final[str] = "1.618.0"

    def fft(self, signal: Sequence[float], sample_rate: float) -> FFTResult:
        """
        Discrete Fourier Transform (radix-2 Cooley-Tukey FFT).
        """
        n = len(signal)
        padded_size = self._next_power_of_2(n)
        padded = list(signal) + [0.0] * (padded_size - n)

        real, imag = self._fft_core(padded)
        bins: list[FrequencyBin] = []
        total_power = 0.0
        dominant_mag = 0.0
        dominant_freq = 0.0
        geometric_sum = 0.0
        arithmetic_sum = 0.0
        half_n = padded_size // 2

        for k in range(half_n):
            mag = math.sqrt(real[k] ** 2 + imag[k] ** 2) / padded_size
            phase = math.atan2(imag[k], real[k])
            power = mag * mag
            freq = (k * sample_rate) / padded_size

            bins.append(FrequencyBin(frequency=freq, magnitude=mag, phase=phase, power=power))
            total_power += power
            if mag > dominant_mag:
                dominant_mag = mag
                dominant_freq = freq
            if power > 0:
                geometric_sum += math.log(power)
            arithmetic_sum += power

        geometric_mean = math.exp(geometric_sum / half_n) if half_n > 0 else 0.0
        arithmetic_mean = arithmetic_sum / half_n if half_n > 0 else 0.0
        spectral_flatness = geometric_mean / arithmetic_mean if arithmetic_mean > 0 else 0.0

        return FFTResult(
            bins=bins,
            dominant_frequency=dominant_freq,
            total_power=total_power,
            spectral_flatness=spectral_flatness,
            sample_rate=sample_rate,
            formula="X[k] = Σ x[n]·e^(-j2πkn/N) (DFT)",
            timestamp=time.time(),
        )

    def design_filter(
        self,
        filter_type: FilterType,
        order: int,
        cutoff_frequency: float,
        sample_rate: float,
    ) -> FilterCoefficients:
        """Butterworth IIR filter design."""
        wc = math.tan((math.pi * cutoff_frequency) / sample_rate)
        numerator: list[float] = []
        denominator: list[float] = []
        sections = math.ceil(order / 2)

        for s in range(sections):
            angle = math.pi * (2 * s + order + 1) / (2 * order)
            alpha = -2 * math.cos(angle)

            if filter_type == FilterType.LOWPASS:
                k = wc * wc
                norm = 1 + alpha * wc + k
                numerator.extend([k / norm, 2 * k / norm, k / norm])
                denominator.extend([1.0, (2 * k - 2) / norm, (1 - alpha * wc + k) / norm])
            else:
                k = 1 / (wc * wc)
                norm = 1 + alpha / wc + k
                numerator.extend([k / norm, -2 * k / norm, k / norm])
                denominator.extend([1.0, (-2 * k + 2) / norm, (1 - alpha / wc + k) / norm])

        return FilterCoefficients(
            numerator=numerator,
            denominator=denominator,
            order=order,
            cutoff_frequency=cutoff_frequency,
            filter_type=filter_type,
        )

    def autocorrelate(self, signal: Sequence[float]) -> AutocorrelationResult:
        """Autocorrelation for periodicity detection."""
        n = len(signal)
        mean = sum(signal) / n if n > 0 else 0.0
        centered = [x - mean for x in signal]
        values: list[float] = []

        for lag in range(n):
            s = sum(centered[i] * centered[i + lag] for i in range(n - lag))
            values.append(s / (n - lag))

        lag0 = values[0] if values and values[0] != 0 else 1.0
        values = [v / lag0 for v in values]

        peak_lag = 1
        peak_val = 0.0
        for i in range(1, len(values)):
            if values[i] > peak_val:
                peak_val = values[i]
                peak_lag = i

        return AutocorrelationResult(
            values=values,
            peak_lag=peak_lag,
            periodicity=peak_lag,
            confidence=peak_val,
            formula="R(τ) = (1/(N-τ)) × Σ (x[n]-μ)(x[n+τ]-μ)",
            timestamp=time.time(),
        )

    def convolve(self, signal: Sequence[float], kernel: Sequence[float]) -> ConvolutionResult:
        """Convolution with φ-normalisation."""
        n = len(signal)
        m = len(kernel)
        output_length = n + m - 1
        output = [0.0] * output_length

        for i in range(n):
            for j in range(m):
                output[i + j] += signal[i] * kernel[j]

        max_abs = max(abs(v) for v in output) if output else 1.0
        norm = PHI_INVERSE / max(1.0, max_abs)
        normalised = [v * norm for v in output]

        return ConvolutionResult(
            output=normalised,
            length=output_length,
            phi_normalization_factor=norm,
            formula="(f * g)[n] = Σ f[k]·g[n-k]; normalised by φ⁻¹/max",
        )

    @staticmethod
    def _next_power_of_2(n: int) -> int:
        p = 1
        while p < n:
            p <<= 1
        return p

    def _fft_core(self, x: list[float]) -> tuple[list[float], list[float]]:
        n = len(x)
        bits = int(math.log2(n))
        real = [0.0] * n
        imag = [0.0] * n

        # Bit-reversal permutation
        for i in range(n):
            rev = 0
            val = i
            for _ in range(bits):
                rev = (rev << 1) | (val & 1)
                val >>= 1
            real[rev] = x[i]

        # Butterfly stages
        size = 2
        while size <= n:
            half = size // 2
            angle = -2 * math.pi / size
            for i in range(0, n, size):
                for k in range(half):
                    tr = math.cos(angle * k)
                    ti = math.sin(angle * k)
                    t_r = real[i + k + half] * tr - imag[i + k + half] * ti
                    t_i = real[i + k + half] * ti + imag[i + k + half] * tr
                    real[i + k + half] = real[i + k] - t_r
                    imag[i + k + half] = imag[i + k] - t_i
                    real[i + k] += t_r
                    imag[i + k] += t_i
            size *= 2

        return real, imag


# ═══════════════════════════════════════════════════════════════════════════════
# RESILIEX ENGINE — Fault Tolerance & Self-Healing
# ═══════════════════════════════════════════════════════════════════════════════


@dataclass(frozen=True)
class FaultEvent:
    """A network fault event."""
    fault_type: FaultType
    affected_nodes: list[str]
    severity: float
    timestamp: float


@dataclass(frozen=True)
class ResilienceMetrics:
    """Network resilience analysis result."""
    availability: float
    redundancy_factor: float
    mean_time_to_recovery: float
    fault_tolerance: float
    phi_resilience: float
    byzantine_threshold: int
    formula: str
    timestamp: float


@dataclass(frozen=True)
class RecoveryStep:
    """Single recovery action."""
    action: str
    target_node: str
    priority: int
    fibonacci_delay: int


@dataclass(frozen=True)
class RecoveryPlan:
    """Full recovery plan."""
    steps: list[RecoveryStep]
    estimated_recovery_time: int
    confidence: float
    phi_priority: float


@dataclass
class CircuitBreakerState:
    """Circuit breaker state."""
    state: CircuitState = CircuitState.CLOSED
    failure_count: int = 0
    success_count: int = 0
    threshold: int = field(default_factory=lambda: round(PHI * 5))
    cooldown_ms: int = field(default_factory=lambda: FIBONACCI_RETRY_MS[5])
    last_state_change: float = field(default_factory=time.time)


class ResiliexEngine:
    """Fault Tolerance & Self-Healing Intelligence."""

    ENGINE_ID: Final[str] = "RESILIEX"
    VERSION: Final[str] = "1.618.0"

    def __init__(self) -> None:
        self._circuit_breakers: dict[str, CircuitBreakerState] = {}

    def analyze_resilience(
        self,
        nodes: Sequence[NetworkNode],
        edges: Sequence[NetworkEdge],
        fault_history: Sequence[FaultEvent],
    ) -> ResilienceMetrics:
        """
        Calculate resilience metrics.
        Byzantine threshold = ⌊(N-1)/3⌋
        """
        n = len(nodes)
        e = len(edges)
        redundancy = e / (n - 1) if n > 1 else 0.0

        total_time = (time.time() - fault_history[0].timestamp) if fault_history else 1.0
        downtime = sum(f.severity * 1000 for f in fault_history)
        availability = max(0.0, 1 - downtime / max(1.0, total_time))

        window = min(5, len(fault_history))
        mttr = (
            sum(FIBONACCI_RETRY_MS[i] for i in range(window)) / window
            if window > 0 else 100.0
        )

        fault_tolerance = redundancy * PHI_INVERSE
        byzantine_threshold = (n - 1) // 3

        return ResilienceMetrics(
            availability=availability,
            redundancy_factor=redundancy,
            mean_time_to_recovery=mttr,
            fault_tolerance=fault_tolerance,
            phi_resilience=availability * PHI_INVERSE + fault_tolerance * (1 - PHI_INVERSE),
            byzantine_threshold=byzantine_threshold,
            formula="PhiResilience = A×φ⁻¹ + FT×(1-φ⁻¹); BFT = ⌊(N-1)/3⌋",
            timestamp=time.time(),
        )

    def generate_recovery_plan(
        self, fault: FaultEvent, available_nodes: Sequence[NetworkNode]
    ) -> RecoveryPlan:
        """Generate recovery plan using Fibonacci-timed steps."""
        steps = [
            RecoveryStep(
                action=self._recovery_action(fault.fault_type),
                target_node=node_id,
                priority=i + 1,
                fibonacci_delay=FIBONACCI_RETRY_MS[min(i, len(FIBONACCI_RETRY_MS) - 1)],
            )
            for i, node_id in enumerate(fault.affected_nodes)
        ]
        total_delay = sum(s.fibonacci_delay for s in steps)
        confidence = min(
            1.0,
            len(available_nodes) / (len(fault.affected_nodes) * PHI)
            if fault.affected_nodes else 1.0,
        )
        return RecoveryPlan(
            steps=steps,
            estimated_recovery_time=total_delay,
            confidence=confidence,
            phi_priority=fault.severity * PHI,
        )

    def get_circuit_breaker(self, service_id: str) -> CircuitBreakerState:
        """Get or create a circuit breaker for a service."""
        if service_id not in self._circuit_breakers:
            self._circuit_breakers[service_id] = CircuitBreakerState()
        return self._circuit_breakers[service_id]

    def record_failure(self, service_id: str) -> CircuitBreakerState:
        """Record a service failure."""
        cb = self.get_circuit_breaker(service_id)
        cb.failure_count += 1
        if cb.failure_count >= cb.threshold:
            cb.state = CircuitState.OPEN
            cb.last_state_change = time.time()
        return cb

    def record_success(self, service_id: str) -> CircuitBreakerState:
        """Record a service success."""
        cb = self.get_circuit_breaker(service_id)
        cb.failure_count = 0
        cb.success_count += 1
        if cb.state != CircuitState.CLOSED:
            cb.state = CircuitState.CLOSED
            cb.last_state_change = time.time()
        return cb

    @staticmethod
    def _recovery_action(fault_type: FaultType) -> str:
        mapping = {
            FaultType.NODE_FAILURE: "RESTART_NODE",
            FaultType.LINK_FAILURE: "REROUTE_TRAFFIC",
            FaultType.CONGESTION: "SHED_LOAD",
            FaultType.BYZANTINE: "ISOLATE_AND_VERIFY",
            FaultType.PARTITION: "MERGE_PARTITIONS",
        }
        return mapping[fault_type]


# ═══════════════════════════════════════════════════════════════════════════════
# QUANTUMLATTICE ENGINE — Quantum Networking
# ═══════════════════════════════════════════════════════════════════════════════


@dataclass(frozen=True)
class QKDResult:
    """QKD key rate estimation result."""
    secure_key_rate: float
    quantum_bit_error_rate: float
    security_parameter: float
    max_distance: float
    bits_discarded: float
    final_key_length: float
    formula: str
    timestamp: float


@dataclass(frozen=True)
class EntanglementMetrics:
    """Entanglement measurement result."""
    concurrence: float
    fidelity: float
    entropy: float
    bell_inequality: float
    is_entangled: bool
    timestamp: float


class QuantumLatticeEngine:
    """Quantum Networking Intelligence — QKD & entanglement."""

    ENGINE_ID: Final[str] = "QUANTUMLATTICE"
    VERSION: Final[str] = "1.618.0"

    def estimate_key_rate(
        self,
        pulse_rate: float,
        qber: float,
        distance: float,
        fiber_loss_db_per_km: float = 0.2,
    ) -> QKDResult:
        """
        BB84 Key Rate: R = ν × η × (1 - 2H(e))
        η = 10^(-αL/10)
        """
        channel_loss = fiber_loss_db_per_km * distance
        transmission = 10 ** (-channel_loss / 10)
        effective_rate = pulse_rate * transmission

        h = self._binary_entropy(qber)
        secure_key_rate = max(0.0, effective_rate * (1 - 2 * h))
        bits_discarded = effective_rate * 2 * h
        max_distance = -10 * math.log10(1e-6) / fiber_loss_db_per_km

        return QKDResult(
            secure_key_rate=secure_key_rate,
            quantum_bit_error_rate=qber,
            security_parameter=1 - 2 * qber,
            max_distance=max_distance,
            bits_discarded=bits_discarded,
            final_key_length=secure_key_rate,
            formula="R = ν×η×(1 - 2H(e)); η = 10^(-αL/10)",
            timestamp=time.time(),
        )

    def channel_fidelity(self, decoherence_rate: float, transit_time: float) -> float:
        """
        Depolarizing channel fidelity:
        F = (1 + 3×exp(-γt)) / 4
        """
        return (1 + 3 * math.exp(-decoherence_rate * transit_time)) / 4

    def measure_entanglement(self, concurrence: float) -> EntanglementMetrics:
        """Entanglement metrics from concurrence."""
        fidelity = (1 + concurrence) / 2
        x = (1 + math.sqrt(1 - concurrence * concurrence)) / 2
        entropy = self._binary_entropy(x)
        bell_inequality = 2 + concurrence * (2 * math.sqrt(2) - 2)

        return EntanglementMetrics(
            concurrence=concurrence,
            fidelity=fidelity,
            entropy=entropy,
            bell_inequality=bell_inequality,
            is_entangled=concurrence > 0,
            timestamp=time.time(),
        )

    @staticmethod
    def _binary_entropy(p: float) -> float:
        if p <= 0 or p >= 1:
            return 0.0
        return -p * math.log2(p) - (1 - p) * math.log2(1 - p)


# ═══════════════════════════════════════════════════════════════════════════════
# NETMIND ENGINE — Adaptive Routing & Traffic Intelligence
# ═══════════════════════════════════════════════════════════════════════════════


@dataclass(frozen=True)
class TrafficFlow:
    """A network traffic flow."""
    flow_id: str
    source: str
    destination: str
    bandwidth_mbps: float
    latency_ms: float
    priority: int
    qos_class: QoSClass


@dataclass(frozen=True)
class RoutingDecision:
    """Routing decision result."""
    flow_id: str
    selected_path: list[str]
    alternative_paths: list[list[str]]
    expected_latency: float
    phi_score: float
    load_factor: float
    formula: str
    timestamp: float


@dataclass(frozen=True)
class TrafficPrediction:
    """Traffic prediction result."""
    horizon: int
    predictions: list[float]
    confidence: float
    trend: TrendDirection
    seasonal_period: int
    formula: str
    timestamp: float


@dataclass(frozen=True)
class CongestionHotspot:
    """A congestion hotspot."""
    node_id: str
    utilization: float
    queue_depth: int
    drop_rate: float


@dataclass(frozen=True)
class CongestionMap:
    """Network congestion map."""
    hotspots: list[CongestionHotspot]
    global_utilization: float
    phi_threshold: float
    timestamp: float


class NetMindEngine:
    """Adaptive Routing & Traffic Intelligence."""

    ENGINE_ID: Final[str] = "NETMIND"
    VERSION: Final[str] = "1.618.0"

    def route_flow(
        self,
        flow: TrafficFlow,
        nodes: Sequence[NetworkNode],
        edges: Sequence[NetworkEdge],
    ) -> RoutingDecision:
        """
        φ-Score adaptive routing.
        Score = (1/latency)^φ × (bandwidth)^(1/φ) × priority_weight
        """
        mesh = MeshWeaverEngine()
        primary = mesh.shortest_path(nodes, edges, flow.source, flow.destination)
        latency = primary.distance if primary else math.inf
        phi_score = (
            (1 / latency) ** PHI * flow.bandwidth_mbps ** PHI_INVERSE * (flow.priority + 1)
            if latency > 0 and latency != math.inf else 0.0
        )

        return RoutingDecision(
            flow_id=flow.flow_id,
            selected_path=primary.path if primary else [],
            alternative_paths=[],
            expected_latency=latency,
            phi_score=phi_score,
            load_factor=flow.bandwidth_mbps / 1000,
            formula="Score = (1/lat)^φ × BW^(1/φ) × prio",
            timestamp=time.time(),
        )

    def predict_traffic(
        self, history: Sequence[float], horizon: int
    ) -> TrafficPrediction:
        """Exponential smoothing with φ-damping."""
        alpha = PHI_INVERSE
        n = len(history)

        if n == 0:
            return TrafficPrediction(
                horizon=horizon,
                predictions=[0.0] * horizon,
                confidence=0.0,
                trend=TrendDirection.STABLE,
                seasonal_period=0,
                formula="ŷ[t+k] = α×y[t] + (1-α)×ŷ[t]; α = φ⁻¹",
                timestamp=time.time(),
            )

        smoothed = history[0]
        for i in range(1, n):
            smoothed = alpha * history[i] + (1 - alpha) * smoothed

        window = min(5, n - 1)
        recent_slope = (
            (history[n - 1] - history[max(0, n - 1 - window)]) / window
            if window > 0 else 0.0
        )

        predictions: list[float] = []
        pred = smoothed
        for _ in range(horizon):
            pred += recent_slope * PHI_INVERSE
            predictions.append(max(0.0, pred))

        if recent_slope > 0.1:
            trend = TrendDirection.INCREASING
        elif recent_slope < -0.1:
            trend = TrendDirection.DECREASING
        else:
            trend = TrendDirection.STABLE

        confidence = math.exp(-horizon * 0.1 * PHI_INVERSE)

        return TrafficPrediction(
            horizon=horizon,
            predictions=predictions,
            confidence=confidence,
            trend=trend,
            seasonal_period=0,
            formula="ŷ[t+k] = α×y[t] + (1-α)×ŷ[t]; α = φ⁻¹",
            timestamp=time.time(),
        )

    def detect_congestion(
        self,
        nodes: Sequence[NetworkNode],
        utilizations: Sequence[float],
        queue_depths: Sequence[int],
    ) -> CongestionMap:
        """Detect congestion hotspots using φ-threshold."""
        threshold = PHI_INVERSE
        hotspots: list[CongestionHotspot] = []
        global_util = 0.0

        for i, node in enumerate(nodes):
            util = utilizations[i] if i < len(utilizations) else 0.0
            global_util += util
            if util >= threshold:
                depth = queue_depths[i] if i < len(queue_depths) else 0
                hotspots.append(CongestionHotspot(
                    node_id=node.id,
                    utilization=util,
                    queue_depth=depth,
                    drop_rate=max(0.0, (util - threshold) / (1 - threshold)),
                ))

        return CongestionMap(
            hotspots=hotspots,
            global_utilization=global_util / len(nodes) if nodes else 0.0,
            phi_threshold=threshold,
            timestamp=time.time(),
        )


# ═══════════════════════════════════════════════════════════════════════════════
# UNIFIED NETWORK SUITE — Facade
# ═══════════════════════════════════════════════════════════════════════════════


@dataclass
class NovaNetworkSuite:
    """Unified NOVA Network Intelligence Suite."""

    mesh_weaver: MeshWeaverEngine = field(default_factory=MeshWeaverEngine)
    spectrion: SpectrionEngine = field(default_factory=SpectrionEngine)
    signal_forge: SignalForgeEngine = field(default_factory=SignalForgeEngine)
    resiliex: ResiliexEngine = field(default_factory=ResiliexEngine)
    quantum_lattice: QuantumLatticeEngine = field(default_factory=QuantumLatticeEngine)
    net_mind: NetMindEngine = field(default_factory=NetMindEngine)


def create_network_suite() -> NovaNetworkSuite:
    """Create the unified NOVA Network Intelligence Suite."""
    return NovaNetworkSuite()


__all__ = [
    # Constants
    "PHI", "PHI_SQUARED", "PHI_INVERSE", "PHI_CUBED", "GOLDEN_ANGLE",
    "FIBONACCI_RETRY_MS", "FIBONACCI_SCALE", "NETWORK_HEALTH",
    # Enums
    "HealthStatus", "FaultType", "ModulationType", "QKDProtocol",
    "QoSClass", "FilterType", "TrendDirection", "CircuitState",
    # Data models
    "Vector3D", "NetworkNode", "NetworkEdge", "NetworkHealthThresholds",
    # MeshWeaver
    "MeshWeaverEngine", "KuramotoResult", "LoadDistribution",
    "TopologyMetrics", "ShortestPathResult", "SpanningTreeResult",
    # Spectrion
    "SpectrionEngine", "ChannelCapacity", "SpectrumAllocation",
    "SpectrumPartition", "OFDMSubcarrier", "OFDMResult",
    # SignalForge
    "SignalForgeEngine", "FrequencyBin", "FFTResult",
    "FilterCoefficients", "AutocorrelationResult", "ConvolutionResult",
    # Resiliex
    "ResiliexEngine", "FaultEvent", "ResilienceMetrics",
    "RecoveryStep", "RecoveryPlan", "CircuitBreakerState",
    # QuantumLattice
    "QuantumLatticeEngine", "QKDResult", "EntanglementMetrics",
    # NetMind
    "NetMindEngine", "TrafficFlow", "RoutingDecision",
    "TrafficPrediction", "CongestionHotspot", "CongestionMap",
    # Suite
    "NovaNetworkSuite", "create_network_suite",
]
