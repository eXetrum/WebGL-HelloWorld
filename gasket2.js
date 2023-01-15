
var canvas;
var gl;

// HW470
var points = [];
var colors = [];
var NumTimesToSubdivide = 5;
var PI = 3.1415926;
// Coords of origin (we can shift image later)
var x0 = 0;
var y0 = 0;
// Rotation angle
var theta = 0;
// HW470

window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }
        
    //
    //  Initialize our data for the Sierpinski Gasket
    //

    // First, initialize the corners of our gasket with three points.
    // HW470
    var vertices = [
        vec2( -0.5, -0.5 ),
        vec2(  0,  1 ),
        vec2(  0.9, 0 )
    ];
	// HW470

    divideTriangle( vertices[0], vertices[1], vertices[2],
                    NumTimesToSubdivide);

    //
    //  Configure WebGL
    //
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );

    //  Load shaders and initialize attribute buffers
    
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
	
	var cBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW );
    
    var vColor = gl.getAttribLocation( program, "vColor" );
    gl.vertexAttribPointer( vColor, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vColor );

    // Load the data into the GPU
    
    var bufferId = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );

    // Associate out shader variables with our data buffer
    
    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

	// HW470
	// Get slider element
	slider_theta = document.getElementById("slider_theta");    
	label_theta = document.getElementById("label_theta");
	theta = slider_theta.value;
	label_theta.textContent = theta;
	theta = toRadian(theta);
	// Assign onchange event listener
    slider_theta.onchange = function() {
        theta = event.srcElement.value;
		label_theta.textContent = theta;
		theta = toRadian(theta);
		// Refresh vertices (recalculate new positions for each vertex)
        refresh();
		// Render new data set
		render();
    }

	refresh();
	// HW470
    render();
};

function distBetween(p1, p2) {
	var [x1, y1] = p1;
	var [x2, y2] = p2;
	var dx = x1 - x2;
	var dy = y1 - y2;
	return Math.sqrt(dx * dx + dy * dy);
}

function toRadian(angle) {
	return angle / 180.0 * PI;
}

function mapColor(p) {
	var [x, y] = p;
	var norm = distBetween(p, [x0, y0]) * PI;
	var r = (1 - Math.sin(x)) / norm;
	var g = (1 + Math.cos(y) * x) / norm;
	var b = (1 - Math.cos(y)) / norm;
	return [r, g, b];
}

function morph(p, angle)
{
	// Unpack vertex values
    var [x, y] = p;
	// Distance between origin and current point
    var norm = distBetween(p, [x0, y0]);
	// Calculate rotation angle
    var phi = norm * angle;
	// Generate new coordinates according to rotation angle
    var xx = x * Math.cos(phi) - y * Math.sin(phi) + x0;
    var yy = x * Math.sin(phi) + y * Math.cos(phi) + y0;
    // Return vertex coords
    return [xx, yy];
}

function triangle( a, b, c )
{
    points.push( a, b, c );
	colors.push(mapColor(a), mapColor(b), mapColor(c));
}

function divideTriangle( a, b, c, count )
{
	a = morph(a, theta);
    b = morph(b, theta);
    c = morph(c, theta);

    // check for end of recursion
    
    if ( count === 0 ) {
        triangle( a, b, c );
    }
    else {
    
        //bisect the sides
        
        var ab = mix( a, b, 0.5 );
        var ac = mix( a, c, 0.5 );
        var bc = mix( b, c, 0.5 );

        --count;

        // three new triangles
        
        divideTriangle( a, ab, ac, count );
        divideTriangle( c, ac, bc, count );
        divideTriangle( b, bc, ab, count );
    }
}

function refresh() {
	console.log("Theta=", theta);
	points = [];
	var vertices = [
        vec2( -0.5, -0.5 ),
        vec2(  0,  1 ),
        vec2(  0.9, 0 )
    ];
	divideTriangle( vertices[0], vertices[1], vertices[2], 
		NumTimesToSubdivide);
}

function render()
{
    gl.clear( gl.COLOR_BUFFER_BIT );
	gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(points));	
    gl.drawArrays( gl.TRIANGLES, 0, points.length );
}

