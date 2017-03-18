# Batches

Poxi batches your drawings to allow undo/redo as well as to draw them in an efficient way. 

There are two kinds of batches:

1. Simple buffered batches which are transformable
2. Raw buffered batches (e.g. imported images), which doesn't contain any specific tile data but grant access to the typed Uint8 pixel data.

Batches store a bounding property, which contains their dynamic position on the grid and their absolute width and height. Batch boundings get automatically updated as soon as their content changes.

Batches also contain a WebGLTexture property, which is the reference to the active texture on the GPU. The texture's content is dynamic as long as it's boundings doesn't change. When a batch gets destroyed (e.g. by undoing or exceeding the undo stack size limit), the texture gets automatically freed from the GPU's memory.
