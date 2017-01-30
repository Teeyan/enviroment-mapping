//var vertex = [];
//var normals = [];
//var faces = [];
var numT = 0;


//function to send data and then send current array data to original arrays
function getTeapotGeometry(vertexArray, normalArray, faces, data)
{
    
    teapotParse(vertexArray, faces, data);
    
    //vertexArray = vertex;
    
    setNormals(vertexArray, normalArray, faces);
    
    //normalArray = normals;
    
    return faces.length/3;
    
}

//function to read in face values and set normals in normal array
function setNormals(vertex, normals, faces)
{
    //populate all vertex normals with 0
    for( i = 0; i < vertex.length; i++ )
    {
       // var temp = vec3.fromValues(0,0,0);
        normals.push(0);
    }
   // console.log("set"+normals.length);
    //find average face normals and add them to each vertex normal
    for( j = 0; j < faces.length; j+=3)
    {
        //get vertices for point1
        var p01 = faces[j]*3;
        var p02 = faces[j]*3 + 1;
        var p03 = faces[j]*3 + 2;
        //get vertices for point2
        var p11 = faces[j+1]*3;
        var p12 = faces[j+1]*3 + 1;
        var p13 = faces[j+1]*3 + 2;
        //get vertices for point3
        var p21 = faces[j+2]*3;
        var p22 = faces[j+2]*3 + 1;
        var p23 = faces[j+2]*3 + 2;
        
        //create points as vectors
        var p0 = vec3.fromValues(vertex[p01], vertex[p02], vertex[p03]);
        var p1 = vec3.fromValues(vertex[p11], vertex[p12], vertex[p13]);
        var p2 = vec3.fromValues(vertex[p21], vertex[p22], vertex[p23]);
        
        //calculate facenormals
        var v1 = vec3.create();
        var v2 = vec3.create();
        
        vec3.sub(v1, p2, p0);
        vec3.sub(v2, p1, p0);
        
        var fnorm = vec3.create();
        //normalize facenormal
        vec3.cross(fnorm, v1, v2);
        vec3.normalize(fnorm,fnorm);
        //add per face normal to each vertex normal
     /*  normals[p01]+=vec3.length(fnorm);
        normals[p02]+=vec3.length(fnorm);
        normals[p03]+=vec3.length(fnorm);
        
        normals[p11]+=vec3.length(fnorm);
        normals[p12]+=vec3.length(fnorm);
        normals[p13]+=vec3.length(fnorm);
        
        normals[p21]+=vec3.length(fnorm);
        normals[p22]+=vec3.length(fnorm);
        normals[p23]+=vec3.length(fnorm);*/
        
        normals[p01]+=fnorm[0];
        normals[p02]+=fnorm[1];
        normals[p03]+=fnorm[2];
        
        normals[p11]+=fnorm[0];
        normals[p12]+=fnorm[1];
        normals[p13]+=fnorm[2];
        
        normals[p21]+=fnorm[0];
        normals[p22]+=fnorm[1];
        normals[p23]+=fnorm[2];
    }
   // console.log("set"+normals.length);
    //normalize vertex normals
    for(k = 0; k < normals.length; k+=3)
    {
        var vnorm = vec3.fromValues(normals[k], normals[k+1], normals[k+2]);
        
        vec3.normalize(vnorm, vnorm);
        
        /*normals[k] = vec3.length(vnorm);
        normals[k+1] = vec3.length(vnorm);
        normals[k+2] = vec3.length(vnorm);*/
        
        normals[k] = vnorm[0];
        normals[k+1] = vnorm[1];
        normals[k+2] = vnorm[2];
    }
    //console.log('set'+normals.length);
    
}

//function to populate vertices
function teapotParse(vertex, faces, data)
{
    
    var counter = 0;
    
    while(counter < data.length)
    {
        //extract vertices
        if(data.charAt(counter) == "v")
        {
            counter += 2;
            //counter to make sure 3 values get entered
            var num = 0;
            //makes sure 3 values are entered
            while(num < 3)
            {
                //store value in string
                var value = "";
                
                while(data.charAt(counter)!=' ' && data.charAt(counter)!= '\n')
                {
                    value+=data.charAt(counter);
                    counter++;
                }
                
                var v = parseFloat(value);
                
                vertex.push(v);
                num++;
                counter++;
            } 
        }
        
        else if(data.charAt(counter) == "f")
        {
            counter += 3;
            //counter to make sure 3 values get entered
            var num = 0;
            //makes sure 3 values are entered
            while(num < 3)
            {
                //store value in string
                var value = "";
                
                while(data.charAt(counter)!=' ' && data.charAt(counter)!= '\n')
                {
                    value+=data.charAt(counter);
                    counter++;
                }
                
                var v = parseFloat(value);
                
                faces.push(v-1);
                num++;
                counter++;
            } 
        }
        
        else
        {
            counter++;
        }
        
    }

    console.log(data.substring(0,100));
    console.log(vertex[0]+" "+vertex[1]+" "+vertex[2]);
    console.log(vertex[vertex.length-3]+" "+vertex[vertex.length-2]+" "+vertex[vertex.length-1]);
    console.log(faces[0]+" "+faces[1]+" "+faces[2]);
    console.log(faces[faces.length-3]+" "+faces[faces.length-2]+" "+faces[faces.length-1]);
}