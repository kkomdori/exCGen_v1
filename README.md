# exCGen: exclusive Code Generator

**exCGen (exclusive Code Generator)** is a web-based tool for designing and screening unique DNA sequence pairs. It generates new DNA sequences based on user-specified conditions (number of sequences, length, GC content, etc.) and finds combinations that minimize interactions between the generated sequences and pre-selected ones.
This helps prevent unwanted binding between multiple DNA strands, thereby increasing the success rate of experiments that require precise control over DNA interactions, such as DNA nanostructure fabrication or multiplex PCR.
  
Deployed here: 
https://kkomdori.github.io/exCGen_v1/
  
## Key Features
- **Custom Sequence Generation**:
  - Specify the **number** and **length** of sequences to generate.
  - Set minimum and maximum **GC content** values.
  - Enforce the inclusion (**Preset**) or exclusion (**Exclusion**) of specific sequences.
- **Interaction Screening**:
  - Minimizes self-binding and cross-binding among the generated sequences.
  - Prevents unwanted binding with pre-selected existing sequences.
- **Energy-Based Filtering**:
  - Calculates binding free energy (&Delta;G) using the Nearest-Neighbor (NN) thermodynamic model.
  - Selects only sequences whose non-specific binding energy is below a user-defined threshold.

## Use Cases
- **DNA Nanotechnology**:
  - Can be used to design sequences for DNA origami and DNA-based nanostructures, ensuring that different DNA strands bind only as intended.
- **Molecular Diagnostics**:
  - Useful for finding primer combinations that minimize primer-dimer interactions in multiplex PCR, where multiple genes are amplified simultaneously.
- **Synthetic Biology**:
  - Helpful for designing various DNA parts used in synthetic gene circuits to prevent interference with each other.

## How it Works
1.  **Initial Sequence Pool Generation**: Creates a pool of random DNA sequences that meet the user-defined conditions for length, GC content, etc.
2.  **Sliding Algorithm Application**: Each generated sequence is slid against all other sequences (and itself) one base at a time to check for binding at all possible positions. This evaluates all potential non-specific bindings, including structures like bulges and hairpins.
3.  **Binding Free Energy Calculation**: The stability at each binding position is calculated as a free energy (&Delta;G) value using the **Nearest-Neighbor (NN) thermodynamic model**. A lower &Delta;G value indicates a more stable bond.
4.  **Optimal Sequence Selection**: Only sequences where the &Delta;G of non-specific binding is below a predetermined threshold (meaning they do not form stable, unintended bonds) are selected as the final result.

## Limitations
- The non-specific structures checked by exCGen are limited to **bulges up to 3 bases in length** and **hairpins up to 7 bases in length**. More complex secondary structures may not be evaluated.
- Calculations are based on the NN thermodynamic parameters from H.T. Allawi and J.Jr. SantaLucia (1997), so there may be discrepancies with actual experimental conditions (e.g., salt concentration, temperature).
- Penalties occurring from mismatches are not taken into consideration.
