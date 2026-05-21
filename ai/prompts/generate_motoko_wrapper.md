# Generate Motoko Wrapper from Julia Function

## Purpose

Generate a type-safe Motoko canister wrapper for a Julia numerical function, ensuring complete type isomorphism across the bridge.

## Input Required

Provide the following information about your Julia function:

1. **Function signature**: e.g., `my_function(A::Matrix{Float64}, b::Vector{Float64}) -> Vector{Float64}`
2. **Function purpose**: Brief description of what it computes
3. **Deterministic**: Is the output deterministic for the same input? (yes/no)
4. **Compute intensity**: Light (can run on-chain) / Heavy (must run off-chain)
5. **Numeric caveats**: Any edge cases or precision considerations

## Type Mapping Reference

Use these mappings from `/ai/type-map.json`:

| Julia | Motoko | Candid |
|-------|--------|--------|
| `Float64` | `Float` | `float64` |
| `Int64` | `Int` | `int64` |
| `Vector{Float64}` | `[Float]` | `vec float64` |
| `Matrix{Float64}` | `[[Float]]` | `vec vec float64` |
| `Union{T, Nothing}` | `?T` | `opt T` |
| `Bool` | `Bool` | `bool` |
| `String` | `Text` | `text` |

## Output Structure

Generate:

1. **Motoko type definitions** for input/output
2. **Canister function** with proper async signature
3. **Candid interface** entry
4. **TypeScript type** definition
5. **Function card** JSON

## Template

```motoko
// Type definitions
public type MyInputType = {
  // fields matching Julia struct
};

public type MyOutputType = {
  // fields matching Julia return
};

// Function implementation
public func myFunction(input : MyInputType) : async MyOutputType {
  // For heavy compute: cache lookup or placeholder
  // For light compute: actual implementation
};
```

## Example Prompt

"Generate a Motoko wrapper for:

```julia
function correlation_matrix(data::Matrix{Float64}) -> Matrix{Float64}
    # Computes Pearson correlation matrix
end
```

- Deterministic: yes
- Compute: heavy (off-chain)
- Caveat: Diagonal is always 1.0"

## Checklist

- [ ] All types have explicit Candid mapping
- [ ] Async for heavy compute, query for light
- [ ] Numeric caveats documented in function card
- [ ] Roundtrip tested for return type
