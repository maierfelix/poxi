# Batches

Poxi batches your drawings to allow undo/redo as well as to draw them in an efficient way. 

There are two kinds of batches:
1. Pixel batches, which contain an Uint8Array storing the drawn pixel data
2. Erase batches, which contain an Uint8Array storing erased pixel the same way as found in pixel batches, but get handled different in the undo/redo process (inject, deject pixels).

Batches store a bounding property, which contains their dynamic position on the grid and their absolute width and height. Batch boundings get automatically updated as soon as their content changes. Batches also have a method to resize down their pixel data by the minimum boundings, e.g. auto cropping out unused parts of their content.

Batches also contain a WebGLTexture property, which is the reference to the active texture on the GPU. As soon as a batch's pixel data get's changed, it's texture gets automatically updated and/or destroyed if it got resized as well. When a batch gets destroyed (e.g. by undoing or exceeding the undo stack size limit), the texture also gets automatically freed from the GPU's memory.
