# Affine transformations

## Part 1

In this exercise i had P = I since we are doing orthographic projection, and M = I since the vertex coordinates in model space were equal to the desired world space coordinates.

The only matrix not equal to I was therefore V, which i set to

V = 

$$V = \text{lookat}([0.5, 0.5, 0.5], [0.0, 0.0, 0.0], [0.0, 1.0, 0.0])$$

lookAt(vec3(0.5, 0.5, 0.5), vec3(0.0, 0.0, 0.0), vec3(0.0, 1.0, 0.0))