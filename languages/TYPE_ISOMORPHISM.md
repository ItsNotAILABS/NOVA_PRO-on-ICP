# TYPE ISOMORPHISM — Complete Bidirectional Type Mapping

## Why This Matters

**Language bridges usually break at exactly these edges.**

AI systems hate ambiguity at boundaries. When building with the Julia ↔ Motoko ↔ JavaScript bridge, you need to know whether `Float64`, `Float`, `number`, arrays, records, async calls, and matrix outputs **preserve meaning** across the bridge.

This document defines **complete bidirectional type mapping** across all three languages — not "approximate" or "lossy" — **isomorphic** (structure-preserving, invertible).

---

## Type Isomorphism Definition

A type mapping is **isomorphic** if:

```
encode(decode(x)) = x  (roundtrip identity)
decode(encode(x)) = x  (roundtrip identity)
```

For NATIVE NOVA PROTOCOL, we guarantee:

```
julia_value → motoko_value → js_value → motoko_value → julia_value = julia_value
```

No precision loss. No structural corruption. No semantic drift.

---

## Primitive Types

### Numeric Types

| Julia | Motoko | JavaScript | Candid | Notes |
|-------|--------|------------|--------|-------|
| `Float64` | `Float` | `number` | `float64` | IEEE 754 double precision (64-bit) |
| `Float32` | `Float` | `number` | `float32` | Widened to Float64 in JS (lossless for Float32 range) |
| `Int64` | `Int` | `BigInt` | `int64` | BigInt required for full precision in JS |
| `Int32` | `Int32` | `number` | `int32` | Safe integer range in JS |
| `Int16` | `Int16` | `number` | `int16` | Safe integer range in JS |
| `Int8` | `Int8` | `number` | `int8` | Safe integer range in JS |
| `UInt64` | `Nat64` | `BigInt` | `nat64` | BigInt required for full precision in JS |
| `UInt32` | `Nat32` | `number` | `nat32` | Safe integer range in JS |
| `UInt16` | `Nat16` | `number` | `nat16` | Safe integer range in JS |
| `UInt8` | `Nat8` | `number` | `nat8` | Safe integer range in JS |
| `Int` | `Int` | `BigInt` | `int` | Arbitrary precision integer |
| `BigInt` | `Nat` | `BigInt` | `nat` | Arbitrary precision natural |

### Boolean

| Julia | Motoko | JavaScript | Candid |
|-------|--------|------------|--------|
| `Bool` | `Bool` | `boolean` | `bool` |

### Text/String

| Julia | Motoko | JavaScript | Candid | Notes |
|-------|--------|------------|--------|-------|
| `String` | `Text` | `string` | `text` | UTF-8 encoded |

### Binary

| Julia | Motoko | JavaScript | Candid | Notes |
|-------|--------|------------|--------|-------|
| `Vector{UInt8}` | `Blob` | `Uint8Array` | `blob` | Raw bytes |

### Unit/Void

| Julia | Motoko | JavaScript | Candid |
|-------|--------|------------|--------|
| `Nothing` | `()` | `null` | `null` |

---

## Compound Types

### Optional / Nullable

| Julia | Motoko | JavaScript | Candid |
|-------|--------|------------|--------|
| `Union{T, Nothing}` | `?T` | `T \| null` | `opt T` |
| `Some(x)` | `?x` | `x` | `opt x` |
| `nothing` | `null` | `null` | `null` |

**Encoding:**
```julia
# Julia
x::Union{Float64, Nothing} = 3.14
# → Motoko: ?Float = ?3.14
# → JavaScript: number | null = 3.14
```

### Arrays / Vectors

| Julia | Motoko | JavaScript | Candid |
|-------|--------|------------|--------|
| `Vector{T}` | `[T]` | `Array<T>` | `vec T` |
| `Vector{Float64}` | `[Float]` | `Float64Array` / `number[]` | `vec float64` |
| `Vector{Int64}` | `[Int]` | `BigInt64Array` / `BigInt[]` | `vec int64` |
| `Vector{UInt8}` | `[Nat8]` / `Blob` | `Uint8Array` | `vec nat8` / `blob` |

**Typed Arrays (Performance):**
```javascript
// JavaScript typed arrays for high-performance numeric data
Float64Array  ↔ Vector{Float64}  ↔ [Float]
Float32Array  ↔ Vector{Float32}  ↔ [Float]  // widened
Int32Array    ↔ Vector{Int32}    ↔ [Int32]
BigInt64Array ↔ Vector{Int64}    ↔ [Int]
Uint8Array    ↔ Vector{UInt8}    ↔ Blob
```

### Fixed-Size Arrays (Tuples)

| Julia | Motoko | JavaScript | Candid |
|-------|--------|------------|--------|
| `NTuple{N, T}` | `(T, T, ..., T)` | `[T, T, ..., T]` | `record { T; T; ...; T }` |
| `Tuple{A, B, C}` | `(A, B, C)` | `[A, B, C]` | `record { A; B; C }` |

**Example:**
```julia
# Julia: 3D coordinate
point::NTuple{3, Float64} = (1.0, 2.0, 3.0)
# → Motoko: (Float, Float, Float) = (1.0, 2.0, 3.0)
# → JavaScript: [number, number, number] = [1.0, 2.0, 3.0]
```

### Records / Structs

| Julia | Motoko | JavaScript | Candid |
|-------|--------|------------|--------|
| `struct T ... end` | `type T = { ... }` | `{ ... }` | `record { ... }` |
| `mutable struct T` | `type T = { var ... }` | `{ ... }` | `record { ... }` |

**Named Fields:**
```julia
# Julia
struct Point3D
    x::Float64
    y::Float64
    z::Float64
end

# Motoko
type Point3D = {
    x : Float;
    y : Float;
    z : Float;
};

# JavaScript
interface Point3D {
    x: number;
    y: number;
    z: number;
}

# Candid
type Point3D = record {
    x : float64;
    y : float64;
    z : float64;
};
```

### Variants / Enums

| Julia | Motoko | JavaScript | Candid |
|-------|--------|------------|--------|
| `@enum T A B C` | `type T = { #A; #B; #C }` | `'A' \| 'B' \| 'C'` | `variant { A; B; C }` |
| Sum types | `#Tag : PayloadType` | `{ tag: string, value: T }` | `variant { Tag : T }` |

**Example:**
```julia
# Julia
@enum Status Pending=0 Active=1 Completed=2 Failed=3

# Motoko
type Status = { #Pending; #Active; #Completed; #Failed };

# JavaScript
type Status = 'Pending' | 'Active' | 'Completed' | 'Failed';

# Candid
type Status = variant { Pending; Active; Completed; Failed };
```

**Variant with Payload:**
```motoko
// Motoko
type Result = {
    #Ok : Float;
    #Err : Text;
};

// JavaScript
type Result = 
    | { tag: 'Ok', value: number }
    | { tag: 'Err', value: string };

// Julia
struct OkResult
    value::Float64
end
struct ErrResult
    value::String
end
Result = Union{OkResult, ErrResult}
```

### Dictionaries / Maps

| Julia | Motoko | JavaScript | Candid |
|-------|--------|------------|--------|
| `Dict{K, V}` | `HashMap.HashMap<K, V>` | `Map<K, V>` | N/A (serialize as `vec record { K; V }`) |
| `Dict{String, T}` | `HashMap.HashMap<Text, T>` | `Record<string, T>` / `{ [key: string]: T }` | `vec record { text; T }` |

**Candid Serialization:**
```
Dict{String, Float64} → vec record { key : text; value : float64 }
```

---

## Special NOVA Types

### φ-Weighted Value

```julia
# Julia
struct PhiWeighted{T}
    value::T
    weight::Float64  # φ^n for n ∈ {0, 1, 2, 3, 4}
end

# Motoko
type PhiWeighted<T> = {
    value : T;
    weight : Float;  // PHI, PHI2, PHI3, PHI4
};

# JavaScript
interface PhiWeighted<T> {
    value: T;
    weight: number;  // 1.618, 2.618, 4.236, 6.854
}

# Candid
type PhiWeighted = record {
    value : T;
    weight : float64;
};
```

### Principal / Identity

| Julia | Motoko | JavaScript | Candid |
|-------|--------|------------|--------|
| `String` (base32) | `Principal` | `Principal` (dfinity/agent) | `principal` |

**Conversion:**
```julia
# Julia: store as base32 text
principal_text = "rrkah-fqaaa-aaaaa-aaaaq-cai"

# Motoko: native Principal type
let p : Principal = Principal.fromText("rrkah-fqaaa-aaaaa-aaaaq-cai");

# JavaScript: @dfinity/principal
import { Principal } from '@dfinity/principal';
const p = Principal.fromText('rrkah-fqaaa-aaaaa-aaaaq-cai');
```

### Time / Timestamp

| Julia | Motoko | JavaScript | Candid | Notes |
|-------|--------|------------|--------|-------|
| `DateTime` | `Int` (nanoseconds) | `BigInt` (nanoseconds) / `Date` (milliseconds) | `int` | IC time is nanoseconds since UNIX epoch |
| `Float64` (ms) | `Int` (ns) | `number` (ms) | `int` | Multiply/divide by 1_000_000 for conversion |

**Conversion:**
```julia
# Julia (milliseconds for biorhythm calculations)
timestamp_ms::Float64 = 1716249894136.0

# Motoko (nanoseconds)
let timestamp_ns : Int = 1716249894136000000;  // ms × 1_000_000

# JavaScript
const timestamp_ms = Date.now();  // milliseconds
const timestamp_ns = BigInt(timestamp_ms) * 1_000_000n;  // nanoseconds for IC
```

---

## Matrix Types (Scientific Computing)

### Dense Matrix

| Julia | JavaScript | Notes |
|-------|------------|-------|
| `Matrix{Float64}` | `Float64Array` + shape | Column-major to row-major conversion |
| `Matrix{Float32}` | `Float32Array` + shape | |
| `Matrix{Int64}` | `BigInt64Array` + shape | |

**Wire Format:**
```typescript
// JavaScript representation of Julia Matrix
interface Matrix<T> {
    data: Float64Array | Float32Array | BigInt64Array;
    rows: number;
    cols: number;
    order: 'column-major' | 'row-major';  // Julia is column-major
}

// Conversion function
function juliaToJSMatrix(data: Float64Array, rows: number, cols: number): Matrix<number> {
    // Convert column-major to row-major for JS conventions
    const result = new Float64Array(rows * cols);
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            result[i * cols + j] = data[j * rows + i];
        }
    }
    return { data: result, rows, cols, order: 'row-major' };
}
```

### Sparse Matrix

```typescript
// Compressed Sparse Column (CSC) format — Julia's default
interface SparseMatrixCSC<T> {
    colptr: Uint32Array;   // column pointers
    rowval: Uint32Array;   // row indices
    nzval: Float64Array;   // non-zero values
    m: number;             // rows
    n: number;             // cols
}
```

---

## Async / Future Types

### Async Function Results

| Julia | Motoko | JavaScript | Candid |
|-------|--------|------------|--------|
| `Task{T}` | `async T` | `Promise<T>` | N/A (async is transport-level) |

**Pattern:**
```julia
# Julia
async function compute()::Task{Float64}
    # ... async computation
    return 3.14
end

# Motoko
public shared func compute() : async Float {
    // ... async computation
    return 3.14;
};

# JavaScript
async function compute(): Promise<number> {
    // ... async computation
    return 3.14;
}
```

### Error / Result Types

| Julia | Motoko | JavaScript | Candid |
|-------|--------|------------|--------|
| `Result{T, E}` | `Result.Result<T, E>` | `{ ok: T } \| { err: E }` | `variant { Ok : T; Err : E }` |

---

## Wire Protocol

### Candid IDL (Primary)

All cross-language communication uses **Candid** (Interface Description Language) as the serialization format:

```candid
// Example: Brain CIL emission
type CILEmission = record {
    organism_id : text;
    timestamp_ns : int;
    thought : text;
    confidence : float64;
    phi_weight : float64;
    biorhythm : float64;
};

service brain : {
    emit_cil : (CILEmission) -> (variant { Ok : nat; Err : text });
    query_cil : (text, nat) -> (vec CILEmission) query;
}
```

### JSON (Debugging / External APIs)

For external integrations and debugging, types serialize to JSON with explicit type hints:

```json
{
    "_type": "PhiWeighted<Float64>",
    "value": 3.14159265358979,
    "weight": 2.618033988749895
}
```

### MessagePack (High-Performance)

For Julia ↔ JavaScript high-frequency data transfer (matrix operations, real-time signals):

```julia
using MsgPack
data = Dict("matrix" => rand(1000, 1000), "timestamp" => time())
bytes = pack(data)  # Fast binary serialization
```

---

## Precision Guarantees

### Float64 Precision

**Guarantee:** All Float64 values preserve full IEEE 754 double precision across the bridge.

```
Julia Float64 → Candid float64 → Motoko Float → Candid float64 → JS number
                                                                ↓
                                                     Full 64-bit precision preserved
```

**Edge Cases Handled:**
- `Inf` → `Infinity` (JS) → `Inf` (Julia)
- `-Inf` → `-Infinity` (JS) → `-Inf` (Julia)
- `NaN` → `NaN` (JS) → `NaN` (Julia)
- Subnormal numbers preserved
- Signed zero preserved (`+0.0` ≠ `-0.0`)

### Integer Precision

**Guarantee:** Integers up to 2^53 preserve exact value in JavaScript `number`. Larger integers use `BigInt`.

| Range | JavaScript Type | Precision |
|-------|-----------------|-----------|
| -(2^53-1) to 2^53-1 | `number` | Exact |
| Beyond ±2^53 | `BigInt` | Exact |
| Arbitrary precision | `BigInt` | Exact |

### String/Text Encoding

**Guarantee:** All text is UTF-8 encoded. No lossy transcoding.

```
Julia String (UTF-8) → Candid text → Motoko Text (UTF-8) → JS string (UTF-16) → Motoko Text → Julia String
                                                          ↓
                                                 UTF-8 ↔ UTF-16 conversion is lossless for valid Unicode
```

---

## Implementation Files

| File | Language | Purpose |
|------|----------|---------|
| `engines/julia/TypeBridge.jl` | Julia | Type serialization/deserialization to Candid |
| `src/organisms/type_bridge/main.mo` | Motoko | Canister exposing typed inter-language calls |
| `src/frontend/src/lib/typeBridge.ts` | TypeScript | JS/TS type definitions and converters |
| `languages/TYPE_ISOMORPHISM.md` | Markdown | This specification |

---

## Validation

Type isomorphism is validated by property-based testing:

```julia
# Julia QuickCheck-style property
@property function roundtrip_float64(x::Float64)
    encoded = to_candid(x)
    decoded = from_candid(encoded, Float64)
    return decoded == x || (isnan(x) && isnan(decoded))
end

@property function roundtrip_struct(p::Point3D)
    encoded = to_candid(p)
    decoded = from_candid(encoded, Point3D)
    return decoded.x == p.x && decoded.y == p.y && decoded.z == p.z
end
```

```typescript
// JavaScript property test
import { fc } from 'fast-check';

fc.assert(
    fc.property(fc.float64(), (x: number) => {
        const encoded = toCandid(x);
        const decoded = fromCandid(encoded);
        return decoded === x || (Number.isNaN(x) && Number.isNaN(decoded));
    })
);
```

---

## Summary

This type system guarantees:

1. **Lossless roundtrip**: `encode(decode(x)) = x` for all supported types
2. **Semantic preservation**: Types mean the same thing across languages
3. **Performance**: Typed arrays and binary protocols for high-throughput data
4. **Safety**: Edge cases (Inf, NaN, large integers) handled correctly
5. **Ergonomics**: Natural syntax in each language

**AI systems can trust this bridge.**

When you send a `Float64` from Julia, you get a `Float` in Motoko and a `number` in JavaScript — with identical bit patterns and mathematical semantics. No surprises. No silent corruption. No ambiguity.

---

*Casa de Medina — Architectos de Architectura Inteligente*
