(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
const SceneNode = require( './sceneNode.js' )
const { param_wrap, MaterialID } = require( './utils.js' )
const { Var, float_var_gen, vec2_var_gen, vec3_var_gen, vec4_var_gen, int_var_gen, VarAlloc } = require( './var.js' )

const Color = function( __r=0, __g=0, __b=0 ) {
  let __value = (__r << 16) + (__g << 8) + __b 
  const name = 'color' + VarAlloc.alloc()

  let __var  = float_var_gen( __value, name )()

  Object.defineProperty( __var, 'r', {
    get()  { return __r },
    set(v) { __r = v; __var.set(  __r * 255 * 255 + __g * 255 + __b ) }
  }) 
  Object.defineProperty( __var, 'g', {
    get()  { return __g },
    set(v) { __g = v; __var.set(  __r * 255 * 255 + __g * 255 + __b ) }
  }) 
  Object.defineProperty( __var, 'b', {
    get()  { return __b },
    set(v) { __b = v; __var.set(  __r * 255 * 255 + __g * 255 + __b ) }
  })

  return __var
}

module.exports = Color

},{"./sceneNode.js":20,"./utils.js":21,"./var.js":22}],2:[function(require,module,exports){
const SceneNode = require( './sceneNode.js' ),
      { param_wrap, MaterialID } = require( './utils.js' ),
      { Var, float_var_gen, vec2_var_gen, vec3_var_gen, vec4_var_gen } = require( './var.js' )

const BG = function( Scene, SDF ) {

  const Background = function( color ) {
    if( SDF.memo.background === undefined ) {
      const bg = Object.create( Background.prototype )

      const __color = param_wrap( color, vec3_var_gen( .5,.6,.7, 'bg' ), 'bg' )  
      
      Object.defineProperty( bg, 'color', {
        get() { return __color },
        set( v ) {
          __color.var.set( v )
        }
      })
      
      // this refers to the current scene via implicit binding in scene.js
      this.postprocessing.push( bg )

      SDF.memo.background = true
    }
    return this
  }

  Background.prototype = SceneNode()
 
  Object.assign( Background.prototype, {
    emit() {
      return ''//this.color.emit()
    },
   
    emit_decl() {
      let str = this.color.emit_decl()
      SDF.memo.background = true

      return str
    },

    update_location( gl, program ) {
      this.color.update_location( gl, program )
    },

    upload_data( gl ) {
      this.color.upload_data( gl )
    }
  })

  return Background
}

module.exports = BG 

},{"./sceneNode.js":20,"./utils.js":21,"./var.js":22}],3:[function(require,module,exports){
const Camera = {
  init( gl, program, handler ) {
    const camera_pos = gl.getUniformLocation( program, 'camera_pos' )
    const camera_normal = gl.getUniformLocation( program, 'camera_normal' )

    this.pos = { dirty:false }
    this.dir = { dirty:true }
    
    let px = 0, py =0, pz = 5, nx = 0, ny = 0, nz = 0
    Object.defineProperties( this.pos, {
      x: {
        get()  { return px },
        set(v) { px = v; this.dirty = true; }
      },

      y: {
        get()  { return py },
        set(v) { py = v; this.dirty = true; }
      },

      z: {
        get()  { return pz },
        set(v) { pz = v; this.dirty = true; }
      },
    })

    Object.defineProperties( this.dir, {
      x: {
        get()  { return nx },
        set(v) { nx = v; this.dirty = true; }
      },

      y: {
        get()  { return ny },
        set(v) { ny = v; this.dirty = true; }
      },

      z: {
        get()  { return nz },
        set(v) { nz = v; this.dirty = true; }
      },
    })

    let init = false
    gl.uniform3f( camera_pos, this.pos.x, this.pos.y, this.pos.z )
    gl.uniform3f( camera_normal, this.dir.x, this.dir.y, this.dir.z )

    handler( ()=> {
      if( this.pos.dirty === true ) {
        gl.uniform3f( camera_pos, this.pos.x, this.pos.y, this.pos.z )
        this.pos.dirty = false
      }
      if( this.dir.dirty === true ) {
        gl.uniform3f( camera_normal, this.dir.x, this.dir.y, this.dir.z )
        this.dir.dirty = false
      }
    })

  }
}

module.exports = Camera

},{}],4:[function(require,module,exports){
arguments[4][1][0].apply(exports,arguments)
},{"./sceneNode.js":20,"./utils.js":21,"./var.js":22,"dup":1}],5:[function(require,module,exports){
const SceneNode = require( './sceneNode.js' )
const { param_wrap, MaterialID } = require( './utils.js' )
const { Var, float_var_gen, vec2_var_gen, vec3_var_gen, vec4_var_gen, int_var_gen, VarAlloc } = require( './var.js' )

const ops = { 
  Displace( __name ) {
    let name = __name === undefined ? 'p' : __name
    const primitive = this.primitive.emit( name );

    const primitiveStr = `float d1${this.id} = ${primitive.out}.x;\n`

    let displaceString = `float d2${this.id} = sin( ${this.point.emit()}.x * ${name}.x ) * `  
    displaceString += `sin( ${this.point.emit()}.y * ${name}.y ) * `
    displaceString += `sin( ${this.point.emit()}.z * ${name}.z );\n`

    const output = {
      out: `vec2(d1${this.id} + d2${this.id}, ${primitive.out}.y)`, 
      preface: primitive.preface + primitiveStr + displaceString 
    }

    return output
  },

  Bend( __name ) {
    let name = __name === undefined ? 'p' : __name
    const primitive = this.primitive.emit( 'q'+this.id );

    let preface=`        float c${this.id} = cos( ${this.point.emit()}.x * ${name}.y );
        float s${this.id} = sin( ${this.point.emit()}.y * ${name}.y );
        mat2  m${this.id} = mat2( c${this.id},-s${this.id},s${this.id},c${this.id} );
        vec3  q${this.id} = vec3( m${this.id} * ${name}.xy, ${name}.z );\n`

    if( typeof primitive.preface === 'string' ) {
      preface += primitive.preface
    }

    return { preface, out:primitive.out }
  },

  Twist( __name ) {
    let name = __name === undefined ? 'p' : __name
    const primitive = this.primitive.emit( 'q'+this.id );

    let preface=`        float c${this.id} = cos( ${this.point.emit()}.x * ${name}.y );
        float s${this.id} = sin( ${this.point.emit()}.y * ${name}.y );
        mat2  m${this.id} = mat2( c${this.id},-s${this.id},s${this.id},c${this.id} );
        vec3  q${this.id} = vec3( m${this.id} * ${name}.xz, ${name}.y );\n`

    if( typeof primitive.preface === 'string' ) {
      preface += primitive.preface
    }

    return { preface, out:primitive.out }
  },

}

const DistanceOps = {}

for( let name in ops ) {

  // get codegen function
  let __op = ops[ name ]

  // create constructor
  DistanceOps[ name ] = function( a,b ) {
    const op = Object.create( DistanceOps[ name ].prototype )
    op.primitive = a
    op.point = b
    op.emit = __op

    const defaultValues = [.5,.5,.5]

    op.id = VarAlloc.alloc()
    const isArray = true 

    let __var =  param_wrap( 
      b, 
      vec3_var_gen( ...defaultValues ) 
    )

    // for assigning entire new vectors to property
    Object.defineProperty( op, 'point', {
      get() { return __var },
      set(v) {
        __var.set( v )
      }
    })

    return op
  } 

  DistanceOps[ name ].prototype = SceneNode()

  //DistanceOps[ name ].prototype.emit = function ( __name ) {
  //  let name = __name === undefined ? 'p' : __name
  //  const primitive = this.primitive.emit( name );

  //  const primitiveStr = `float d1 = ${primitive.out}.x;\n`

  //  const displaceString = `float d2 = sin( ${this.point.emit()}.x * ${name}.x ) * sin( ${this.point.emit()}.y * ${name}.y ) * sin( ${this.point.emit()}.z * ${name}.z );\n`

  //  const output = {
  //    out: `vec2(d1 + d2, ${primitive.out}.y)`, 
  //    preface: primitive.preface + primitiveStr + displaceString 
  //  }

  //  return output
  //}

  DistanceOps[name].prototype.emit_decl = function () {
    let str =  this.primitive.emit_decl() + this.point.emit_decl()

    return str
  };

  DistanceOps[name].prototype.update_location = function(gl, program) {
    this.primitive.update_location( gl, program )
    this.point.update_location( gl, program )
  }

  DistanceOps[name].prototype.upload_data = function(gl) {
    this.primitive.upload_data( gl )
    this.point.upload_data( gl )
  }
}

module.exports = DistanceOps


},{"./sceneNode.js":20,"./utils.js":21,"./var.js":22}],6:[function(require,module,exports){
const SceneNode = require( './sceneNode.js' )
const { param_wrap, MaterialID } = require( './utils.js' )
const { Var, float_var_gen, vec2_var_gen, vec3_var_gen, vec4_var_gen } = require( './var.js' )

const ops = { 
  Union( a,b )        { return `opU( ${a}, ${b} )` },
  Intersection( a,b ) { return `opI( ${a}, ${b} )` },
  Difference( a,b ) { return `opS( ${a}, ${b} )` },  
  SmoothUnion(  a,b,c) { return `opSmoothUnion( ${a}, ${b}, ${c} )` },
  StairsUnion(  a,b,c,d ) { return `fOpUnionStairs( ${a}, ${b}, ${c}, ${d} )` },
  StairsIntersection( a,b,c,d ) { return `fOpIntersectionStairs( ${a}, ${b}, ${c}, ${d} )` },
  StairsDifference( a,b,c,d ) { return `fOpSubstractionStairs( ${a}, ${b}, ${c}, ${d} )` },
  RoundUnion( a,b,c ) { return `fOpUnionRound( ${a}, ${b}, ${c} )` },
  RoundDifference( a,b,c ) { return `fOpDifferenceRound( ${a}, ${b}, ${c} )` },
  RoundIntersection( a,b,c ) { return `fOpIntersectionRound( ${a}, ${b}, ${c} )` },
  ChamferUnion( a,b,c ) { return `fOpUnionChamfer( ${a}, ${b}, ${c} )` },
  ChamferDifference( a,b,c ) { return `fOpDifferenceChamfer( ${a}, ${b}, ${c} )` },
  ChamferIntersection( a,b,c ) { return `fOpIntersectionChamfer( ${a}, ${b}, ${c} )` },
  Pipe( a,b,c ) { return `fOpPipe( ${a}, ${b}, ${c} )` },
  Engrave( a,b,c ) { return `fOpEngrave( ${a}, ${b}, ${c} )` },
  Groove( a,b,c,d ) { return `fOpGroove( ${a}, ${b}, ${c}, ${d} )` },
  Tongue( a,b,c,d ) { return `fOpTongue( ${a}, ${b}, ${c}, ${d} )` },
}

const DistanceOps = {}

for( let name in ops ) {

  // get codegen function
  let op = ops[ name ]

  // create constructor
  DistanceOps[ name ] = function( a,b,c,d ) {
    const op = Object.create( DistanceOps[ name ].prototype )
    op.a = a
    op.b = b

    let __c = param_wrap( c, float_var_gen(.3) )

    Object.defineProperty( op, 'c', {
      get() { return __c },
      set(v) {
        __c.set( v )
      }
    })

    let __d = param_wrap( d, float_var_gen(4) )

    Object.defineProperty( op, 'd', {
      get() { return __d },
      set(v) {
        __d.set( v )
      }
    })

    op.matId = MaterialID.alloc()

    return op
  } 

  DistanceOps[ name ].prototype = SceneNode()

  DistanceOps[ name ].prototype.emit = function ( __name ) {
    const emitterA = this.a.emit( __name )
    const emitterB = this.b.emit( __name )
    const emitterC = this.c !== undefined ? this.c.emit() : null
    const emitterD = this.d !== undefined ? this.d.emit() : null

    const output = {
      out: op( emitterA.out, emitterB.out, emitterC, emitterD ), 
      preface: (emitterA.preface || '') + (emitterB.preface || '')
    }

    return output
  }

  DistanceOps[name].prototype.emit_decl = function () {
    let str =  this.a.emit_decl() + this.b.emit_decl()
    if( this.c !== undefined ) str += this.c.emit_decl()
    if( this.d !== undefined ) str += this.d.emit_decl()

    return str
  };

  DistanceOps[name].prototype.update_location = function(gl, program) {
    this.a.update_location( gl, program )
    this.b.update_location( gl, program )
    if( this.c !== undefined ) this.c.update_location( gl, program )
    if( this.d !== undefined ) this.d.update_location( gl, program )
  }

  DistanceOps[name].prototype.upload_data = function(gl) {
    this.a.upload_data( gl )
    this.b.upload_data( gl )
    if( this.c !== undefined ) this.c.upload_data( gl )
    if( this.d !== undefined ) this.d.upload_data( gl )
    
  }
}

DistanceOps.Union2 = function( ...args ) {
  const u = args.reduce( (state,next) => DistanceOps.Union( state, next ) )

  return u
}

DistanceOps.SmoothUnion2 = function( ...args ) {
  // accepts unlimited arguments, but the last one could be a blending coefficient
  let blend = .8, u

  if( typeof args[ args.length - 1 ] === 'number' ) {
    blend = args.pop()
    u = args.reduce( (state,next) => DistanceOps.SmoothUnion( state, next, blend ) )
  }else{
    u = args.reduce( (state,next) => DistanceOps.SmoothUnion( state, next ) )
  }

  return u
}

DistanceOps.RoundUnion2 = function( ...args ) {
  // accepts unlimited arguments, but the last one could be a blending coefficient
  let blend = .25, u

  if( typeof args[ args.length - 1 ] === 'number' ) {
    blend = args.pop()
    u = args.reduce( (state,next) => DistanceOps.RoundUnion( state, next, blend ) )
  }else{
    u = args.reduce( (state,next) => DistanceOps.RoundUnion( state, next ) )
  }

  return u
}
module.exports = DistanceOps


},{"./sceneNode.js":20,"./utils.js":21,"./var.js":22}],7:[function(require,module,exports){
const { Var, float_var_gen, vec2_var_gen, vec3_var_gen, vec4_var_gen, int_var_gen, VarAlloc } = require( './var.js' )
const SceneNode = require( './sceneNode.js' )
const { param_wrap, MaterialID } = require( './utils.js' )


const getDomainOps = function( SDF ) {

const Repetition = function( primitive, distance ) {
  const repeat = Object.create( Repetition.prototype )
  repeat.distance = param_wrap( distance, vec3_var_gen( 1,1,5 ) )
  repeat.sdf = primitive

  return repeat 
}

Repetition.prototype = SceneNode()

Repetition.prototype.emit = function ( name='p' ) {
  const pId = this.sdf.matId
  const pName = 'p' + pId

  let preface =
`        vec3 ${pName} = mod( ${name}, ${this.distance.emit()} ) - .5 * ${this.distance.emit() };\n`


  const primitive = this.sdf.emit( pName )

  if( typeof primitive.preface === 'string' ) preface += primitive.preface 

  return { out:primitive.out, preface }
}

Repetition.prototype.emit_decl = function () {
	return this.distance.emit_decl() + this.sdf.emit_decl()
};

Repetition.prototype.update_location = function( gl, program ) {
  this.distance.update_location( gl, program )
  this.sdf.update_location( gl, program )
}

Repetition.prototype.upload_data = function( gl ) {
  this.distance.upload_data( gl )
  this.sdf.upload_data( gl )
}

const PolarRepetition = function( primitive, count, distance ) {
  const repeat = Object.create( PolarRepetition.prototype )
  repeat.count = param_wrap( count, float_var_gen( 7) )
  repeat.distance = param_wrap( distance, float_var_gen( 1 ) )
  repeat.sdf = primitive 

  return repeat 
}

PolarRepetition.prototype = SceneNode()

PolarRepetition.prototype.emit = function ( name='p' ) {
  const pId = VarAlloc.alloc()
  const pName = 'p' + pId

  let preface =`        vec3 ${pName} = polarRepeat( ${name}, ${this.count.emit() } ); 
        ${pName} -= vec3(${this.distance.emit()},0.,0.);\n`
//`//mod( ${name}, ${this.distance.emit()} ) - .5 * ${this.distance.emit() };\n`


  const sdf = this.sdf.emit( pName )


  if( typeof sdf.preface === 'string' ) preface += sdf.preface

  return { out:sdf.out, preface }
}

PolarRepetition.prototype.emit_decl = function () {
	return this.distance.emit_decl() + this.count.emit_decl() + this.sdf.emit_decl()
};

PolarRepetition.prototype.update_location = function( gl, program ) {
  this.count.update_location( gl, program )
  this.sdf.update_location( gl, program )
  this.distance.update_location( gl, program )
}

PolarRepetition.prototype.upload_data = function( gl ) {
  this.count.upload_data( gl )
  this.sdf.upload_data( gl )
  this.distance.upload_data( gl )
}
const Rotation = function( primitive, axis, angle=0 ) {
  const rotate = Object.create( Rotation.prototype )
  
  rotate.primitive = primitive
  rotate.matId = VarAlloc.alloc()

  let __var =  param_wrap( 
    axis, 
    param_wrap( axis, vec3_var_gen( 0,0,0 ) )    
  )

  Object.defineProperty( rotate, 'axis', {
    get() { return __var },
    set(v) {
      __var.set( v )
    }
  })

  let __angle  = param_wrap( 
    angle, 
    param_wrap( angle, float_var_gen( Math.PI/4 ) )
  )

  Object.defineProperty( rotate, 'angle', {
    get() { return __angle },
    set(v) {
      __angle.set( v )
    }
  })

  return rotate 
}


Rotation.prototype = SceneNode()

Rotation.prototype.emit = function ( name='p' ) {
  const pId = this.matId
  const pName = 'q'+pId

  let preface =
`        mat4 m${pName} = rotationMatrix(${this.axis.emit()}, -${this.angle.emit()});
        vec3 ${pName} = ( m${pName} * vec4(${name},1.) ).xyz;
`

  const primitive = this.primitive.emit( pName )
  let out = primitive.out

  if( typeof primitive.preface === 'string' )
    preface += primitive.preface

  return { out, preface }
}

Rotation.prototype.emit_decl = function () {
  let str = this.axis.emit_decl() + this.angle.emit_decl() + this.primitive.emit_decl()

  if( SDF.memo.rotation === undefined ) {
    str += Rotation.prototype.glsl
    SDF.memo.rotation = true
  }

  return str
};

Rotation.prototype.update_location = function( gl, program ) {
  this.axis.update_location( gl, program )
  this.angle.update_location( gl, program )
  this.primitive.update_location( gl, program )
}

Rotation.prototype.upload_data = function( gl ) {
  this.axis.upload_data( gl )
  this.angle.upload_data( gl )
  this.primitive.upload_data( gl )
}

Rotation.prototype.glsl = `   mat4 rotationMatrix(vec3 axis, float angle) {
    vec3 a = normalize(axis);
    float s = sin(angle);
    float c = cos(angle);
    float oc = 1.0 - c;
    float sx = s * a.x;
    float sy = s * a.y;
    float sz = s * a.z;
    float ocx = oc * a.x;
    float ocy = oc * a.y;
    float ocz = oc * a.z;
    float ocxx = ocx * a.x;
    float ocxy = ocx * a.y;
    float ocxz = ocx * a.z;
    float ocyy = ocy * a.y;
    float ocyz = ocy * a.z;
    float oczz = ocz * a.z;
    mat4 m = mat4(
      vec4(ocxx + c, ocxy - sz, ocxz + sy, 0.0),
      vec4(ocxy + sz, ocyy + c, ocyz - sx, 0.0),
      vec4(ocxz - sy, ocyz + sx, oczz + c, 0.0),
      vec4( 0.0, 0.0, 0.0, 1.0)
    );

    return m;
  }
`


const Translate = function( primitive, amount ) {
  const rotate = Object.create( Translate.prototype )
  
  rotate.primitive = primitive
  rotate.matId = MaterialID.alloc()

  let __var =  param_wrap( 
    amount, 
    param_wrap( amount, vec3_var_gen( 0,0,0 ) )    
  )

  Object.defineProperty( rotate, 'amount', {
    get() { return __var },
    set(v) {
      __var.set( v )
    }
  })

  return rotate 
}
Translate.prototype = SceneNode()

Translate.prototype.emit = function( name='p' ) {
  const pId = this.matId
  const pName = name+pId

  let preface = `vec3 ${pName} = ${name} - ${this.amount.emit()};\n`

  const primitive = this.primitive.emit( pName )
  let out = primitive.out

  if( typeof primitive.preface === 'string' )
    preface += primitive.preface

  return { out, preface }
}

Translate.prototype.emit_decl = function () {
	return this.amount.emit_decl() + this.primitive.emit_decl()
};

Translate.prototype.update_location = function( gl, program ) {
  this.amount.update_location( gl, program )
  this.primitive.update_location( gl, program )
}

Translate.prototype.upload_data = function( gl ) {
  this.amount.upload_data( gl )
  this.primitive.upload_data( gl )
}

const Scale = function( primitive,amount ) {
  const scale = Object.create( Scale.prototype )
  
  scale.primitive = primitive
  scale.matId = MaterialID.alloc()

  let __var =  param_wrap( 
    amount, 
    param_wrap( amount, vec3_var_gen( 1,1,1 ) )    
  )

  Object.defineProperty( scale, 'amount', {
    get() { return __var },
    set(v) {
      __var.set( v )
    }
  })

  return scale 
}

//return primitive(p/s)*s;
Scale.prototype.emit = function ( name='p' ) {
  const pId = 'scalar'+this.matId

  let preface =`  vec3 ${pId} = p/${this.amount.emit()};\n `

  const primitive = this.primitive.emit( pId )
  let out = primitive.out + ' * ' + this.amount.emit()

  if( typeof primitive.preface === 'string' )
    preface += primitive.preface

  return { out, preface }
}

Scale.prototype.emit_decl = function () {
	return this.amount.emit_decl() + this.primitive.emit_decl()
};

Scale.prototype.update_location = function( gl, program ) {
  this.amount.update_location( gl, program )
  this.primitive.update_location( gl, program )
}

Scale.prototype.upload_data = function( gl ) {
  this.amount.upload_data( gl )
  this.primitive.upload_data( gl )
}

return { Repeat:Repetition, Scale, Rotation, Translate, PolarRepeat:PolarRepetition }

}

module.exports = getDomainOps

},{"./sceneNode.js":20,"./utils.js":21,"./var.js":22}],8:[function(require,module,exports){
const emit_float = function( a ) {
	if (a % 1 === 0)
		return a.toFixed( 1 )
	else
		return a
}

const FloatPrototype = {
  type: 'float',
	emit() { return emit_float( this.x ) },
	emit_decl() { return "" }
}


const Float = function( x=0 ) {
  const f = Object.create( FloatPrototype )
  f.x = x
  return f
}

module.exports = Float

},{}],9:[function(require,module,exports){
const SceneNode = require( './sceneNode.js' ),
      { param_wrap, MaterialID } = require( './utils.js' ),
      { Var, float_var_gen, vec2_var_gen, vec3_var_gen, vec4_var_gen, int_var_gen, VarAlloc } = require( './var.js' )

const Fogger = function( Scene, SDF ) {

  const Fog = function( amount=0.055, color ) {
    const fog = Object.create( Fog.prototype )
    const __amount = param_wrap( amount, float_var_gen( amount ) )  
    
    Object.defineProperty( fog, 'amount', {
      get() { return __amount },
      set( v ) {
        __amount.var.set( v )
      }
    })

    const __color = param_wrap( color, vec3_var_gen( .5,.6,.7 ) )  
    
    Object.defineProperty( fog, 'color', {
      get() { return __color },
      set( v ) {
        __color.var.set( v )
      }
    })
    
    // this refers to the current scene via implicit binding in scene.js
    this.postprocessing.push( fog )

    return this
  }

  Fog.prototype = SceneNode()
 
  Object.assign( Fog.prototype, {
    emit() {
      return `  color = applyFog( color, t.x, ${this.amount.emit()} );`
    },
   
    emit_decl() {
      let str = this.amount.emit_decl() + this.color.emit_decl()
      const preface = `  vec3 applyFog( in vec3 rgb, in float distance, in float amount ) {
    float fogAmount = 1. - exp( -distance * amount );
    vec3  fogColor  = ${this.color.emit()};
    return mix( rgb, fogColor, fogAmount );
  }
  `
      if( SDF.memo.fog === undefined ) {
        str = str + preface
        SDF.memo.fog = true
      }else{
        str = ''
      }

      return str
    },

    update_location( gl, program ) {
      this.amount.update_location( gl, program )
      this.color.update_location( gl, program )
    },

    upload_data( gl ) {
      this.amount.upload_data( gl )
      this.color.upload_data( gl )
    }
  })

  return Fog
}

module.exports = Fogger

},{"./sceneNode.js":20,"./utils.js":21,"./var.js":22}],10:[function(require,module,exports){
'use strict'

const Marching = require( './main.js' )

Marching.__export = Marching.export
Marching.export = obj => {
  obj.march = Marching.createScene.bind( Marching )
  Marching.__export( obj )
}

window.Marching = Marching

module.exports = Marching

},{"./main.js":13}],11:[function(require,module,exports){
const emit_int = function( a ) {
	if( a % 1 !== 0 )
		return Math.ronud( a )
	else
		return a
}

const IntPrototype = {
  type: 'int',
	emit() { return emit_int( this.x ) },
	emit_decl() { return "" }
}


const Int = function( x=0 ) {
  const f = Object.create( IntPrototype )
  f.x = x
  return f
}

module.exports = Int

},{}],12:[function(require,module,exports){
const SceneNode = require( './sceneNode.js' ),
      { param_wrap, MaterialID } = require( './utils.js' ),
      { Var, float_var_gen, vec2_var_gen, vec3_var_gen, vec4_var_gen } = require( './var.js' ),
      { Vec2, Vec3, Vec4 } = require( './vec.js' )

const glsl = require( 'glslify' )

const Lights = function( SDF ) {

  const Light = {
    lights:[],
    materials:[],

    defaultLights:`
      Light lights[2] = Light[2](
        Light( vec3( 2.,2.,3. ),  vec3(0.25,0.25,.25), 1. ),
        Light( vec3( -2.,2.,3. ), vec3(.25,0.25,0.25), 1. )
      );
    `,

    defaultMaterials:`
      Material materials[2] = Material[2](
        Material( vec3( 1. ), vec3(0.,0.,0.), vec3(1.), 8., Fresnel( 0., 1., 2.) ),
        Material( vec3( 1. ), vec3(1.,0.,0.), vec3(1.), 8., Fresnel( 0., 1., 2.) )
      );
    `,

    light( pos=Vec3(2,2,3), color=Vec3(0,0,1), attenuation=1, intensity=1 ) {
      const light = { pos, color, attenuation, intensity }
      return light
    },

    emit_lights() {
      if( this.lights.length === 0 ) return this.defaultLights

      let str = `      Light lights[${this.lights.length}] = Light[${this.lights.length}](`

      for( let light of this.lights ) {
        str += `\n        Light( ${light.pos.emit().out}, ${light.color.emit().out}, ${light.attenuation.toFixed(1)}),` 
      }
      
      str = str.slice(0,-1) // remove trailing comma

      str += ');'

      return str
    },

    mode:'directional',
    gen( shadows=8 ) {
      const str = this.modes[ this.mode ]( this.lights.length || 2, this.emit_lights(), SDF.materials.emit_materials(), shadows )
   
      return str
    },
    modes:{
      directional( numlights, lights, materials, shadow=0 ) {
        const __shadow = shadow > 0
          ? `diffuseCoefficient *= softshadow( surfacePosition, normalize( light.position ), 0.02, 2.5, ${shadow.toFixed(1)} );` 
          : ''

        const str = glsl(["#define GLSLIFY 1\n  int MAX_LIGHTS = ",";\n        float ao( in vec3 pos, in vec3 nor )\n{\n\tfloat occ = 0.0;\n    float sca = 1.0;\n    for( int i=0; i<5; i++ )\n    {\n        float hr = 0.01 + 0.12 * float( i ) / 4.0;\n        vec3 aopos =  nor * hr + pos;\n        float dd = scene ( aopos ).x;\n        occ += -(dd-hr)*sca;\n        sca *= 0.95;\n    }\n    return clamp( 1.0 - 3.0*occ, 0.0, 1.0 );    \n}\n\n        ","\n\n        ","\n\n        vec3 lighting( vec3 surfacePosition, vec3 normal, vec3 rayOrigin, vec3 rayDirection, float materialID ) {\n          vec3  outputColor   = vec3( 0. );\n   \n          // applies to all lights\n          float occlusion = ao( surfacePosition, normal );\n\n          Material mat = materials[ int(materialID) ];\n\n          for( int i = 0; i < 20000; i++ ) {\n            if( i >= MAX_LIGHTS ) break;\n\n            Light light = lights[ i ];\n\n            vec3 surfaceToLightDirection = normalize( light.position - surfacePosition );\n            \n            // get similarity between normal and direction to light\n            float diffuseCoefficient = dot( normal, surfaceToLightDirection ); \n\n            // get reflection angle for light striking surface\n            vec3 angleOfReflection = reflect( -surfaceToLightDirection, normal );\n\n            // see if reflected light travels to camera and generate coefficient accordingly\n            float specularAngle = clamp( dot( angleOfReflection, -rayDirection ), 0., 1. );\n            float specularCoefficient = pow( specularAngle, mat.shininess );\n\n            // lights should have an attenuation factor\n            float attenuation = 1. / ( light.attenuation * pow( length( light.position - surfacePosition ), 2. ) ); \n\n            float fresnel = mat.fresnel.bias + mat.fresnel.scale * pow( 1.0 + dot( rayDirection, normal ), mat.fresnel.power ); \n\n            ","\n\n            vec3 color = vec3( 0. );\n            color += 1.2 * diffuseCoefficient * mat.diffuse * light.color;\n            color += 2.2 * specularCoefficient * mat.specular * light.color;\n            color += 0.3 * (mat.ambient * light.color) * occlusion;\n            color += (fresnel * light.color);\n\n            // gamma correction must occur before light attenuation\n            // which means it must be applied on a per-light basis unfortunately\n            vec3 gammaCorrectedColor = pow( color, vec3( 1./2.2 ) );\n            vec3 attenuatedColor = 2. * gammaCorrectedColor * attenuation; \n\n            outputColor += attenuatedColor;\n          }\n\n          return outputColor;\n        }",""],numlights,materials,lights,__shadow)

        return str
      }, 

      orenn( numlights, lights, materials, shadow=0 ) {
        const __shadow = shadow > 0
          ? `diffuseCoefficient *= softshadow( surfacePosition, normalize( light.position ), 0.02, 2.5, ${shadow.toFixed(1)} );` 
          : ''

        const str = glsl(["#define GLSLIFY 1\n  int MAX_LIGHTS = ",";\n        float ao( in vec3 pos, in vec3 nor )\n{\n\tfloat occ = 0.0;\n    float sca = 1.0;\n    for( int i=0; i<5; i++ )\n    {\n        float hr = 0.01 + 0.12 * float( i ) / 4.0;\n        vec3 aopos =  nor * hr + pos;\n        float dd = scene ( aopos ).x;\n        occ += -(dd-hr)*sca;\n        sca *= 0.95;\n    }\n    return clamp( 1.0 - 3.0*occ, 0.0, 1.0 );    \n}\n\n        float orenNayarDiffuse(\n  vec3 lightDirection,\n  vec3 viewDirection,\n  vec3 surfaceNormal,\n  float roughness,\n  float albedo) {\n  \n  float LdotV = dot(lightDirection, viewDirection);\n  float NdotL = dot(lightDirection, surfaceNormal);\n  float NdotV = dot(surfaceNormal, viewDirection);\n\n  float s = LdotV - NdotL * NdotV;\n  float t = mix(1.0, max(NdotL, NdotV), step(0.0, s));\n\n  float sigma2 = roughness * roughness;\n  float A = 1.0 + sigma2 * (albedo / (sigma2 + 0.13) + 0.5 / (sigma2 + 0.33));\n  float B = 0.45 * sigma2 / (sigma2 + 0.09);\n\n  return albedo * max(0.0, NdotL) * (A + B * s / t) / 3.14159265;\n}\n\n        float gaussianSpecular(\n  vec3 lightDirection,\n  vec3 viewDirection,\n  vec3 surfaceNormal,\n  float shininess) {\n  vec3 H = normalize(lightDirection + viewDirection);\n  float theta = acos(dot(H, surfaceNormal));\n  float w = theta / shininess;\n  return exp(-w*w);\n}\n\n        ","\n\n        ","\n\n        vec3 lighting( vec3 surfacePosition, vec3 normal, vec3 rayOrigin, vec3 rayDirection, float materialID ) {\n          vec3  outputColor   = vec3( 0. );\n   \n          // applies to all lights\n          float occlusion = ao( surfacePosition, normal );\n\n          Material mat = materials[ int(materialID) ];\n\n          for( int i = 0; i < 20000; i++ ) {\n            if( i >= MAX_LIGHTS ) break;\n\n            Light light = lights[ i ];\n\n            vec3 surfaceToLightDirection = normalize( light.position - surfacePosition );\n            \n            //vec3 dif2 = col2 * orenn( surfaceToLightDirection, -rayDirection, normal, 0.15, 1.0);\n            //vec3 spc2 = col2 * gauss(dir2, -rd, nor, 0.15);\n\n            // get similarity between normal and direction to light\n            float diffuseCoefficient = orenNayarDiffuse( surfaceToLightDirection, -rayDirection, normal, 0.15, 4.0);\n\n            // get reflection angle for light striking surface\n            vec3 angleOfReflection = reflect( -surfaceToLightDirection, normal );\n\n            // see if reflected light travels to camera and generate coefficient accordingly\n            float specularAngle = clamp( dot( angleOfReflection, -rayDirection ), 0., 1. );\n            float specularCoefficient = gaussianSpecular( surfaceToLightDirection, -rayDirection, normal, .5 ); \n\n            // lights should have an attenuation factor\n            float attenuation = 1. / ( light.attenuation * pow( length( light.position - surfacePosition ), 2. ) ); \n\n            float fresnel = mat.fresnel.bias + mat.fresnel.scale * pow( 1.0 + dot( rayDirection, normal ), mat.fresnel.power ); \n\n            ","\n\n            vec3 color = vec3( 0. );\n            color += 1.2 * diffuseCoefficient * mat.diffuse * light.color;\n            color += 2.2 * specularCoefficient * mat.specular * light.color;\n            color += 0.3 * (mat.ambient * light.color) * occlusion;\n            color += (fresnel * light.color);\n\n            // gamma correction must occur before light attenuation\n            // which means it must be applied on a per-light basis unfortunately\n            vec3 gammaCorrectedColor = pow( color, vec3( 1./2.2 ) );\n            vec3 attenuatedColor = 2. * gammaCorrectedColor * attenuation; \n\n            outputColor += attenuatedColor;\n          }\n\n          return outputColor;\n        }",""],numlights,materials,lights,__shadow)

        return str
      }, 
      global( numlights, lights, materials, shadow=8 ) {
        const str = glsl(["#define GLSLIFY 1\n\n        float ao( in vec3 pos, in vec3 nor )\n{\n\tfloat occ = 0.0;\n    float sca = 1.0;\n    for( int i=0; i<5; i++ )\n    {\n        float hr = 0.01 + 0.12 * float( i ) / 4.0;\n        vec3 aopos =  nor * hr + pos;\n        float dd = scene ( aopos ).x;\n        occ += -(dd-hr)*sca;\n        sca *= 0.95;\n    }\n    return clamp( 1.0 - 3.0*occ, 0.0, 1.0 );    \n}\n\n        ","\n\n        ","\n\n        vec3 lighting( vec3 pos, vec3 nor, vec3 ro, vec3 rd, float materialID ) {\n          Light light = lights[ 0 ];\n          vec3  ref = reflect( rd, nor ); // reflection angle\n          float occ = ao( pos, nor );\n          vec3  lig = normalize( light.position ); // light position\n          float amb = clamp( 0.5 + 0.5 * nor.y, 0.0, 1.0 );\n          float dif = clamp( dot( nor, lig ), 0.0, 1.0 );\n\n          // simulated backlight\n          float bac = clamp( dot( nor, normalize( vec3( -lig.x, 0.0 , -lig.z ))), 0.0, 1.0 ) * clamp( 1.0-pos.y, 0.0 ,1.0 );\n\n          // simulated skydome light\n          float dom = smoothstep( -0.1, 0.1, ref.y );\n          float fre = pow( clamp( 1.0 + dot( nor,rd ),0.0,1.0 ), 3.0);\n          float spe = pow( clamp( dot( ref, lig ), 0.0, 1.0 ), 8.0 );\n\n          dif *= softshadow( pos, lig, 0.02, 2.5, "," );\n          dom *= softshadow( pos, ref, 0.02, 2.5, "," );\n\n          Material mat = materials[ int(materialID) ];\n\n          vec3 brdf = vec3( 0.0 );\n          brdf += 1.20 * dif * vec3( 1.00,0.90,0.60 ) * mat.diffuse * light.color;\n          brdf += 2.20 * spe * vec3( 1.00,0.90,0.60 ) * dif * mat.specular * light.color;\n          brdf += 0.30 * amb * vec3( 0.50,0.70,1.00 ) * occ * mat.ambient * light.color;\n          brdf += 0.40 * dom * vec3( 0.50,0.70,1.00 );\n          brdf += 0.70 * bac * vec3( 0.25 );\n          brdf += 0.40 * (fre * light.color);\n\n          return brdf;\n        }",""],materials,lights,shadow.toFixed(1),shadow.toFixed(1))

        return str

      },

      global_save( numlights, lights, materials, shadow='' ) {
        const str = glsl(["#define GLSLIFY 1\n\n        float ao( in vec3 pos, in vec3 nor )\n{\n\tfloat occ = 0.0;\n    float sca = 1.0;\n    for( int i=0; i<5; i++ )\n    {\n        float hr = 0.01 + 0.12 * float( i ) / 4.0;\n        vec3 aopos =  nor * hr + pos;\n        float dd = scene ( aopos ).x;\n        occ += -(dd-hr)*sca;\n        sca *= 0.95;\n    }\n    return clamp( 1.0 - 3.0*occ, 0.0, 1.0 );    \n}\n\n        ","\n\n        ","\n\n        vec3 lighting( vec3 pos, vec3 nor, vec3 ro, vec3 rd, float materialID ) {\n          Light light = lights[ 0 ];\n          vec3  ref = reflect( rd, nor ); // reflection angle\n          float occ = ao( pos, nor );\n          vec3  lig = normalize( light.position ); // light position\n          float amb = clamp( 0.5 + 0.5 * nor.y, 0.0, 1.0 );\n          float dif = clamp( dot( nor, lig ), 0.0, 1.0 );\n\n          // simulated backlight\n          float bac = clamp( dot( nor, normalize( vec3( -lig.x, 0.0 , -lig.z ))), 0.0, 1.0 ) * clamp( 1.0-pos.y, 0.0 ,1.0 );\n\n          // simulated skydome light\n          float dom = smoothstep( -0.1, 0.1, ref.y );\n          float fre = pow( clamp( 1.0 + dot( nor,rd ),0.0,1.0 ), 2.0 );\n          float spe = pow( clamp( dot( ref, lig ), 0.0, 1.0 ), 8.0 );\n\n          dif *= softshadow( pos, lig, 0.02, 2.5, 8. );\n          dom *= softshadow( pos, ref, 0.02, 2.5, 8. );\n\n          Material mat = materials[ int(materialID) ];\n\n          vec3 brdf = vec3( 0.0 );\n          brdf += 1.20 * dif * vec3( 1.00,0.90,0.60 ) * mat.diffuse * light.color;\n          brdf += 2.20 * spe * vec3( 1.00,0.90,0.60 ) * dif * mat.specular * light.color;\n          brdf += 0.30 * amb * vec3( 0.50,0.70,1.00 ) * occ * mat.ambient * light.color;\n          brdf += 0.40 * dom * vec3( 0.50,0.70,1.00 ) * occ;\n          brdf += 0.70 * bac * vec3( 0.25 ) * occ;\n          brdf += 0.40 * (fre * light.color) * occ;\n\n          return brdf;\n        }",""],materials,lights)

        return str

      },

      normal( numlights, lights, materials ) {
        const str = glsl(["#define GLSLIFY 1\nvec3 lighting( vec3 pos, vec3 nor, vec3 ro, vec3 rd, float materialID ) {\n          return nor;\n        }",""])

        return str

      },
    },
  }

  return Light
}

module.exports = Lights

// old lighting
/*
*/

},{"./sceneNode.js":20,"./utils.js":21,"./var.js":22,"./vec.js":23,"glslify":24}],13:[function(require,module,exports){
const SDF = {
  camera:           require( './camera.js' ),
  __primitives:     require( './primitives.js' ),
  vectors:          require( './vec.js' ),
  distanceOps:      require( './distanceOperations.js' ),
  distanceDeforms:  require( './distanceDeformations.js' ),
  __domainOps:      require( './domainOperations.js' ),
  __noise:          require( './noise.js' ),
  __scene:          require( './scene.js' ),
  __lighting:       require( './lighting.js' ),
  __materials:      require( './material.js' ),
  Color:            require( './color.js' ),

  // a function that generates the fragment shader
  renderFragmentShader: require( './renderFragmentShader.js' ),

  // additional callbacks that are run once per frame
  callbacks: [],

  // the main drawing callback
  render: null,

  // the scene is a chain of Unions combining all elements together
  scene:  null,

  defaultVertexSource:`    #version 300 es
    in vec3 a_pos;
		in vec2 a_uv;
		out vec2 v_uv;

		void main() {
			v_uv = a_uv;
			gl_Position = vec4(a_pos, 1.0);
    }`
  ,

  export( obj ) {
    Object.assign( 
      obj, 
      this.primitives,
      this.vectors,
      this.distanceOps,
      this.domainOps,
      this.distanceDeforms
    )

    obj.Light = this.Light
    obj.Material = this.Material
    obj.Color = this.Color
    obj.camera = this.camera
    obj.createScene = this.createScene
    obj.callbacks = this.callbacks
    obj.noise = this.noise
  },

  init( canvas ) {
    this.primitives = this.__primitives( this )
    this.Scene      = this.__scene( this )
    this.domainOps  = this.__domainOps( this )
    this.noisee     = this.__noise( this )
    this.export( this )
    this.canvas = canvas 

    this.lighting   = this.__lighting( this )
    this.Light = this.lighting.light
    this.materials  = this.__materials( this )
    this.Material = this.materials.material

    //this.canvas.width = window.innerWidth * size
    //this.canvas.height = window.innerHeight * size
    this.gl = this.canvas.getContext( 'webgl2' )

    this.initBuffers()
    //this.createDefaultScene()
  },

  initBuffers() {
    const gl = this.gl
    gl.clearColor( 0.0, 0.0, 0.0, 1.0 )
    gl.clear(gl.COLOR_BUFFER_BIT)

    const vbo = gl.createBuffer()

    const vertices = new Float32Array([
      -1.0, -1.0, 0.0, 0.0, 0.0,
      1.0, -1.0, 0.0, 1.0, 0.0,
      -1.0, 1.0, 0.0, 0.0, 1.0,
      1.0, 1.0, 0.0, 1.0, 1.0
    ])

    gl.bindBuffer (gl.ARRAY_BUFFER, vbo )
    gl.bufferData( gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW )

    const ibo = gl.createBuffer()

    const indices = new Uint16Array( [0, 1, 2, 2, 1, 3] )

    gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, ibo )
    gl.bufferData( gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW )
  },

  // generate shaders, initialize camera, start rendering loop 
  createScene( ...args ) {
    const scene = this.Scene( args, this.canvas )

    this.requiredGeometries = []
    this.memo = {}

    //const [ variablesDeclaration, sceneRendering, shapes ] = this.generateSDF( ...objs )

    //this.fs = this.renderFragmentShader( 
    //  variablesDeclaration, 
    //  sceneRendering.out, 
    //  sceneRendering.preface,
    //  this.requiredGeometries.join('\n'), 
    //  steps, minDistance, maxDistance.toFixed(1) 
    //)

    return scene
  },

  start( fs, width, height, shouldAnimate ) {
    if( this.render !== null ) this.render.running = false

    this.fs = fs
    this.callbacks.length = 0

    this.render = this.initWebGL( this.defaultVertexSource, fs, width, height, shouldAnimate )
    this.render.running = true

    this.camera.init( this.gl, this.program, cb => { 
      this.callbacks.push( cb )
    })

    setTimeout( ()=> this.render( 0.0 ), 0 )
  },

  generateSDF( __scene ) {
    let scene = { preface:'' }

    /* if there is more than one object in our scene, chain pairs of objects
       in Unions. So, given objects a,b,c, and d create:

       Union( a, Union( b, Union( c,d ) ) )

       ... or something like that. If there is only a single object,
       use that object as the entire scene.
     */

    let objs = __scene.objs
    if( objs.length > 1 ) {
      // reduce objects to nested Unions
      scene.output = objs.reduce( ( current, next ) => {
        return this.Union( current, next ) 
      })
    }else{
      scene.output = objs[0]
    }

    // create an fancy emit() function that wraps the scene
    // with an id #.
    // XXX does every SDF need an id? this has always confused me...

    scene.output.__emit = scene.output.emit.bind( scene.output )
    scene.output.emit = ()=> {
      const emitted = scene.output.__emit()
      const output = {
        out:`  vec2( _out.x, _out.y )`,

        preface: (emitted.preface || '') + `        vec2 _out = ${emitted.out};\n`
      }

      return output 
    }

    this.scene = scene.output

    let variablesDeclaration = scene.output.emit_decl()
    const sceneRendering = scene.output.emit()

    let pp = ''
    for( let processor of __scene.postprocessing ) {
      pp += processor.emit()
      variablesDeclaration += processor.emit_decl()
    }

    this.postprocessing = __scene.postprocessing

    return [ variablesDeclaration, sceneRendering, pp ]
  },

	compile( type, source ) {
    const gl = this.gl

		const shader = this.shader = gl.createShader( type );
		gl.shaderSource( shader, source )
		gl.compileShader( shader )

		if( gl.getShaderParameter( shader, gl.COMPILE_STATUS) !== true ) {
			let log = gl.getShaderInfoLog( shader )
			gl.deleteShader( shader )

			console.log( source )
			console.log( log )

			return null
		}

		return shader
	},

  createProgram( vs_source, fs_source ) {
    const gl = this.gl
		const vs = this.compile( gl.VERTEX_SHADER, vs_source )
		const fs = this.compile( gl.FRAGMENT_SHADER, fs_source )

		if( null === vs || null === fs ) return null

		const program = gl.createProgram()
		gl.attachShader( program, vs )
		gl.attachShader( program, fs )
		gl.linkProgram( program )

		if( gl.getProgramParameter( program, gl.LINK_STATUS ) !== true ){
			const log = gl.getProgramInfoLog( program )
			gl.deleteShader(vs)
			gl.deleteShader(fs)
			gl.deleteProgram(program)

			console.error( log )
			return null
		}

		return program
  },

  clear() {
    this.callbacks.length = 0
    this.render.running = false
  },

  initWebGL( vs_source, fs_source, width, height,shouldAnimate=false ) {
    const gl = this.gl

	  const program = this.program = this.createProgram( vs_source, fs_source )
	  gl.useProgram(program);

    const loc_a_pos = gl.getAttribLocation(program, "a_pos");
    const loc_a_uv = gl.getAttribLocation(program, "a_uv");

    const loc_u_time = gl.getUniformLocation(program, "time");
    const loc_u_resolution = gl.getUniformLocation(program, "resolution" )

    this.postprocessing.forEach( pp => { 
      pp.update_location( gl, program ) 
    })
    this.scene.update_location( gl, program )


    gl.enableVertexAttribArray(loc_a_pos)
    gl.enableVertexAttribArray(loc_a_uv)

    gl.vertexAttribPointer(loc_a_pos, 3, gl.FLOAT, false, 20, 0)
    gl.vertexAttribPointer(loc_a_uv, 2, gl.FLOAT, false, 20, 12)

    gl.viewport( 0,0,width,height )
    gl.uniform2f( loc_u_resolution, width, height )

    const matTexSize = 4
    let matTexData = new Uint8Array( matTexSize * 4 )
    let matTexDataDirty = false

    const matTex = gl.createTexture()
    gl.bindTexture( gl.TEXTURE_2D, matTex )
    gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGBA, matTexSize, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, matTexData )
    
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT )
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT )
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR )
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR  )

    const matTexLoc = gl.getUniformLocation(program, "uMatSampler" )
    const matTexSizeLoc = gl.getUniformLocation(program, "matTexSize" )

    gl.activeTexture(gl.TEXTURE0);
    gl.uniform1i(matTexLoc, 0);
    gl.uniform1f(matTexSizeLoc, matTexSize);

    let total_time = 0.0;

    function clamp255(v) {
      return Math.min( Math.max( 0, v * 255 ), 255 )
    }

    function updateMaterial( id, color ) {
      matTexData[id * 4]     = clamp255( color[0] )
      matTexData[id * 4 + 1] = clamp255( color[1] )
      matTexData[id * 4 + 2] = clamp255( color[2] )
      matTexData[id * 4 + 3] = clamp255( color[3] )
      matTexDataDirty = true;
    }

    updateMaterial( 0, [1, 0.0, 0.0, 1] )
    updateMaterial( 1, [0.0, 1, 0.0, 1] )
    updateMaterial( 2, [0.0, 0.0, 1, 1] )
    updateMaterial( 3, [0.0, 0.0, 1, 1] )

    const render = function( timestamp ){
      if( render.running === true && shouldAnimate === true ) {
        window.requestAnimationFrame( render )
      }else if( render.running === false ) {
        gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT )
        return
      }
      
      total_time = timestamp / 1000.0
      gl.uniform1f( loc_u_time, total_time )

      this.callbacks.forEach( cb => cb( total_time ) )

      this.scene.upload_data( gl )
      this.postprocessing.forEach( pp => pp.upload_data( gl ) )

      if (matTexDataDirty) {
        gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGBA, matTexSize, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, matTexData )
        matTexDataDirty = false
      }

      gl.drawElements( gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0 )

    }.bind( SDF )

    render.running = true

    return render    
  }
}

module.exports = SDF

},{"./camera.js":3,"./color.js":4,"./distanceDeformations.js":5,"./distanceOperations.js":6,"./domainOperations.js":7,"./lighting.js":12,"./material.js":14,"./noise.js":15,"./primitives.js":17,"./renderFragmentShader.js":18,"./scene.js":19,"./vec.js":23}],14:[function(require,module,exports){
const SceneNode = require( './sceneNode.js' ),
      { param_wrap, MaterialID } = require( './utils.js' ),
      { Var, float_var_gen, vec2_var_gen, vec3_var_gen, vec4_var_gen } = require( './var.js' ),
      { Vec2, Vec3, Vec4 } = require( './vec.js' )


const glsl = require( 'glslify' )

const __Materials = function( SDF ) {

  const Materials = {
  //  emit() {
  //    return `  color = applyMaterial( color, t.x, ${this.amount.emit()} );`
  //  },
   
  //  emit_decl() {
  //    let str = this.amount.emit_decl() + this.color.emit_decl()
  //    const preface = `  vec3 applyMaterial( in vec3 rgb, in float distance, in float amount ) {
  //  float materialAmount = 1. - exp( -distance * amount );
  //  vec3  materialColor  = ${this.color.emit()};
  //  return mix( rgb, materialColor, materialAmount );
  //}
  //`
  //    if( SDF.memo.material === undefined ) {
  //      str = str + preface
  //      SDF.memo.material = true
  //    }

  //    return str
  //  },

  //  update_location( gl, program ) {
  //    this.amount.update_location( gl, program )
  //    this.color.update_location( gl, program )
  //  },

  //  upload_data( gl ) {
  //    this.amount.upload_data( gl )
  //    this.color.upload_data( gl )
  //  },
    __materials:[],
    materials:[],
/*      struct Material {
        vec3 ambient;
        vec3 diffuse;
        vec3 specular;
        float shininess;
        Fresnel fresnel;
        };  */

    defaultMaterials:`
      Material materials[2] = Material[2](
        Material( vec3( .15 ), vec3(0.,0.,0.), vec3(1.), 8., Fresnel( 0., 1., 4.) ),
        Material( vec3( .05 ), vec3(1.,0.,0.), vec3(1.), 8., Fresnel( 0., 1., 4.) )
      );
    `,

    material( ambient=Vec3(.05), diffuse=Vec3(0,0,1), specular=Vec3(1,1,1), shininess=8, fresnel=Vec3(0,1,2) ){
      const mat = { ambient, diffuse, specular, shininess, fresnel, id:MaterialID.alloc() }
      Materials.materials.push( mat )
      
      return mat 
    },
   
    emit_materials() {
      if( this.materials.length === 0 ) return this.defaultMaterials

      let str = `Material materials[${this.materials.length}] = Material[${this.materials.length}](`

      this.materials.sort( (a,b) => a.id > b.id ? 1 : -1 ) 

      for( let mat of this.materials ) {
        const ambient = `vec3( ${f(mat.ambient.x)}, ${f(mat.ambient.y)}, ${f(mat.ambient.z)} )`
        const diffuse = `vec3( ${f(mat.diffuse.x)}, ${f(mat.diffuse.y)}, ${f(mat.diffuse.z)} )`
        const specular = `vec3( ${f(mat.specular.x)}, ${f(mat.specular.y)}, ${f(mat.specular.z)} )`
        const fresnel = `Fresnel( ${f(mat.fresnel.x)}, ${f(mat.fresnel.y)}, ${f(mat.fresnel.z)} )`

        str += `\n        Material( ${ambient}, ${diffuse}, ${specular}, ${f(mat.shininess)}, ${fresnel} ),` 
      }
      
      str = str.slice(0,-1) // remove trailing comma

      str += '\n      );'

      return str
    },
  }

  const f = value => value % 1 === 0 ? value.toFixed(1) : value 

  Object.assign( Materials.material, {
    green : Materials.material( Vec3(0,.25,0), Vec3(0,1,0), Vec3(0), 2, Vec3(0) ),
    red   : Materials.material( Vec3(.25,0,0), Vec3(1,0,0), Vec3(0), 2, Vec3(0) ),
    blue  : Materials.material( Vec3(0,0,.25), Vec3(0,0,1), Vec3(0), 2, Vec3(0) ),
    cyan  : Materials.material( Vec3(0,.25,.25), Vec3(0,1,1), Vec3(0), 2, Vec3(0) ),
    magenta  : Materials.material( Vec3(.25,0,.25), Vec3(1,0,1), Vec3(0), 2, Vec3(0) ),
    yellow : Materials.material( Vec3(.25,.25,.0), Vec3(1,1,0), Vec3(0), 2, Vec3(0) ),
    black : Materials.material( Vec3(0, 0, 0), Vec3(0,0,0), Vec3(0), 2, Vec3(0) ),
    white: Materials.material( Vec3(.25), Vec3(1), Vec3(1), 2, Vec3(0) ),
    grey : Materials.material( Vec3(.25), Vec3(.33), Vec3(1), 2, Vec3(0) )
  })

  return Materials
}

module.exports = __Materials

},{"./sceneNode.js":20,"./utils.js":21,"./var.js":22,"./vec.js":23,"glslify":24}],15:[function(require,module,exports){
const glsl = require( 'glslify' )
const SceneNode = require( './sceneNode.js' )
const { param_wrap, MaterialID } = require( './utils.js' )
const { Var, float_var_gen, vec2_var_gen, vec3_var_gen, vec4_var_gen } = require( './var.js' )

const getNoise = function( SDF ) {
Noise = function( strength=.25, bias=1, timeMod=1 ) {
  const op = Object.create( Noise.prototype )
  op.type = 'string'
  op.isGen = true

  const defaultValues = [.5,.5,.5]

  op.matId = MaterialID.alloc()

  const __strength = param_wrap( strength, float_var_gen( strength ) )
  const __timeMod  = param_wrap( timeMod, float_var_gen( timeMod ) )

  Object.defineProperty( op, 'strength', {
    get() { return __strength },
    set(v) {
     __strength.var.set( v )
    }
  })
  Object.defineProperty( op, 'timeMod', {
    get() { return __timeMod },
    set(v) {
     __timeMod.var.set( v )
    }
  })
  const __bias  = param_wrap( bias, float_var_gen( bias ) )

  Object.defineProperty( op, 'bias', {
    get() { return __bias},
    set(v) {
     __bias.var.set( v )
    }
  })
  return op
} 

Noise.prototype = SceneNode()

Noise.prototype.emit = function ( __name ) {
  let name = __name === undefined ? 'p' : __name

  const out = `(${this.bias.emit()} + snoise( vec4( p, time * ${this.timeMod.emit()} )) * ${this.strength.emit()})`  

  const output = {
    out,
    preface:''
  }

  return output
}
Noise.prototype.glsl = glsl(["#define GLSLIFY 1\n    //\n// Description : Array and textureless GLSL 2D/3D/4D simplex\n//               noise functions.\n//      Author : Ian McEwan, Ashima Arts.\n//  Maintainer : ijm\n//     Lastmod : 20110822 (ijm)\n//     License : Copyright (C) 2011 Ashima Arts. All rights reserved.\n//               Distributed under the MIT License. See LICENSE file.\n//               https://github.com/ashima/webgl-noise\n//\n\nvec4 mod289(vec4 x) {\n  return x - floor(x * (1.0 / 289.0)) * 289.0; }\n\nfloat mod289(float x) {\n  return x - floor(x * (1.0 / 289.0)) * 289.0; }\n\nvec4 permute(vec4 x) {\n     return mod289(((x*34.0)+1.0)*x);\n}\n\nfloat permute(float x) {\n     return mod289(((x*34.0)+1.0)*x);\n}\n\nvec4 taylorInvSqrt(vec4 r)\n{\n  return 1.79284291400159 - 0.85373472095314 * r;\n}\n\nfloat taylorInvSqrt(float r)\n{\n  return 1.79284291400159 - 0.85373472095314 * r;\n}\n\nvec4 grad4(float j, vec4 ip)\n  {\n  const vec4 ones = vec4(1.0, 1.0, 1.0, -1.0);\n  vec4 p,s;\n\n  p.xyz = floor( fract (vec3(j) * ip.xyz) * 7.0) * ip.z - 1.0;\n  p.w = 1.5 - dot(abs(p.xyz), ones.xyz);\n  s = vec4(lessThan(p, vec4(0.0)));\n  p.xyz = p.xyz + (s.xyz*2.0 - 1.0) * s.www;\n\n  return p;\n  }\n\n// (sqrt(5) - 1)/4 = F4, used once below\n#define F4 0.309016994374947451\n\nfloat snoise(vec4 v)\n  {\n  const vec4  C = vec4( 0.138196601125011,  // (5 - sqrt(5))/20  G4\n                        0.276393202250021,  // 2 * G4\n                        0.414589803375032,  // 3 * G4\n                       -0.447213595499958); // -1 + 4 * G4\n\n// First corner\n  vec4 i  = floor(v + dot(v, vec4(F4)) );\n  vec4 x0 = v -   i + dot(i, C.xxxx);\n\n// Other corners\n\n// Rank sorting originally contributed by Bill Licea-Kane, AMD (formerly ATI)\n  vec4 i0;\n  vec3 isX = step( x0.yzw, x0.xxx );\n  vec3 isYZ = step( x0.zww, x0.yyz );\n//  i0.x = dot( isX, vec3( 1.0 ) );\n  i0.x = isX.x + isX.y + isX.z;\n  i0.yzw = 1.0 - isX;\n//  i0.y += dot( isYZ.xy, vec2( 1.0 ) );\n  i0.y += isYZ.x + isYZ.y;\n  i0.zw += 1.0 - isYZ.xy;\n  i0.z += isYZ.z;\n  i0.w += 1.0 - isYZ.z;\n\n  // i0 now contains the unique values 0,1,2,3 in each channel\n  vec4 i3 = clamp( i0, 0.0, 1.0 );\n  vec4 i2 = clamp( i0-1.0, 0.0, 1.0 );\n  vec4 i1 = clamp( i0-2.0, 0.0, 1.0 );\n\n  //  x0 = x0 - 0.0 + 0.0 * C.xxxx\n  //  x1 = x0 - i1  + 1.0 * C.xxxx\n  //  x2 = x0 - i2  + 2.0 * C.xxxx\n  //  x3 = x0 - i3  + 3.0 * C.xxxx\n  //  x4 = x0 - 1.0 + 4.0 * C.xxxx\n  vec4 x1 = x0 - i1 + C.xxxx;\n  vec4 x2 = x0 - i2 + C.yyyy;\n  vec4 x3 = x0 - i3 + C.zzzz;\n  vec4 x4 = x0 + C.wwww;\n\n// Permutations\n  i = mod289(i);\n  float j0 = permute( permute( permute( permute(i.w) + i.z) + i.y) + i.x);\n  vec4 j1 = permute( permute( permute( permute (\n             i.w + vec4(i1.w, i2.w, i3.w, 1.0 ))\n           + i.z + vec4(i1.z, i2.z, i3.z, 1.0 ))\n           + i.y + vec4(i1.y, i2.y, i3.y, 1.0 ))\n           + i.x + vec4(i1.x, i2.x, i3.x, 1.0 ));\n\n// Gradients: 7x7x6 points over a cube, mapped onto a 4-cross polytope\n// 7*7*6 = 294, which is close to the ring size 17*17 = 289.\n  vec4 ip = vec4(1.0/294.0, 1.0/49.0, 1.0/7.0, 0.0) ;\n\n  vec4 p0 = grad4(j0,   ip);\n  vec4 p1 = grad4(j1.x, ip);\n  vec4 p2 = grad4(j1.y, ip);\n  vec4 p3 = grad4(j1.z, ip);\n  vec4 p4 = grad4(j1.w, ip);\n\n// Normalise gradients\n  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));\n  p0 *= norm.x;\n  p1 *= norm.y;\n  p2 *= norm.z;\n  p3 *= norm.w;\n  p4 *= taylorInvSqrt(dot(p4,p4));\n\n// Mix contributions from the five corners\n  vec3 m0 = max(0.6 - vec3(dot(x0,x0), dot(x1,x1), dot(x2,x2)), 0.0);\n  vec2 m1 = max(0.6 - vec2(dot(x3,x3), dot(x4,x4)            ), 0.0);\n  m0 = m0 * m0;\n  m1 = m1 * m1;\n  return 49.0 * ( dot(m0*m0, vec3( dot( p0, x0 ), dot( p1, x1 ), dot( p2, x2 )))\n               + dot(m1*m1, vec2( dot( p3, x3 ), dot( p4, x4 ) ) ) ) ;\n\n  }\n\n"])

Noise.prototype.emit_decl = function () {
  let str = this.strength.emit_decl() + this.timeMod.emit_decl() + this.bias.emit_decl()

  if( SDF.memo.noise === undefined ) {
    str = Noise.prototype.glsl + str
    SDF.memo.noise = true
  }

  return str
};

Noise.prototype.update_location = function(gl, program) {
  this.strength.update_location( gl, program )
  this.timeMod.update_location( gl, program )
  this.bias.update_location( gl, program )
}

Noise.prototype.upload_data = function(gl) {
  this.strength.upload_data( gl )
  this.timeMod.upload_data( gl )
  this.bias.upload_data( gl )
}

return Noise

}

module.exports = getNoise 

},{"./sceneNode.js":20,"./utils.js":21,"./var.js":22,"glslify":24}],16:[function(require,module,exports){

const glsl = require( 'glslify' )
const Color = require( './Color' )

module.exports = {
  Box: {
    parameters:[
      { name:'size', type:'vec3', default:[1,1,1] },
      { name:'center', type:'vec3', default:[0,0,0] },
      { name:'material', type:'mat', default:null }
    ],

    primitiveString( pName ) { 
	    return `sdBox( ${pName} - ${this.center.emit()}, ${this.size.emit()} )`;
    },

    glslify:glsl(["#define GLSLIFY 1\n    float sdBox( vec3 p, vec3 b )\n{\n  vec3 d = abs(p) - b;\n  return min(max(d.x,max(d.y,d.z)),0.0) +\n         length(max(d,0.0));\n}\n\n"])
  }, 

  // XXX we should normalize dimensions in the shader... 
  Cone: {
    parameters:[
      { name:'dimensions', type:'vec3', default:[.8,.6,.3] },
      { name:'center', type:'vec3', default:[0,0,0] },
      { name:'material', type:'mat', default:null }
    ],

    primitiveString( pName ) { 
      return `sdCone( ${pName} - ${this.center.emit()}, ${this.dimensions.emit()} )`
    },
    glslify:glsl(["#define GLSLIFY 1\n    float sdCone( in vec3 p, in vec3 c )\n{\n    vec2 q = vec2( length(p.xz), p.y );\n    float d1 = -p.y-c.z;\n    float d2 = max( dot(q,c.xy), p.y);\n    return length(max(vec2(d1,d2),0.0)) + min(max(d1,d2), 0.);\n}\n\n"])
  }, 

	Cylinder: {
    parameters:[
      { name:'dimensions', type:'vec2', default:[.8,.6] },
      { name:'center', type:'vec3', default:[0,0,0] },
      { name:'material', type:'mat', default:null }
    ],

    primitiveString( pName ) { 
      return `sdCappedCylinder( ${pName} - ${this.center.emit()}, ${this.dimensions.emit()} )`
    },

    glslify:`    float sdCappedCylinder( vec3 p, vec2 h ) {
    vec2 d = abs(vec2(length(p.xz),p.y)) - h;
    return min(max(d.x,d.y),0.0) + length(max(d,0.0));
  }`
  }, 

  Capsule: {	
    parameters:[
      { name:'start', type:'vec3', default:[0,0,0] },
      { name:'end', type:'vec3', default:[.8,1,0] },
      { name:'radius', type:'float', default:.5 },
      { name:'material', type:'mat', default:null }
    ],

    primitiveString( pName ) { 
      return `sdCapsule( ${pName},  ${this.start.emit()}, ${this.end.emit()}, ${this.radius.emit()} )`
    },
    glslify:glsl(["#define GLSLIFY 1\n      float sdCapsule( vec3 p, vec3 a, vec3 b, float r )\n{\n    vec3 pa = p - a, ba = b - a;\n    float h = clamp( dot(pa,ba)/dot(ba,ba), 0.0, 1.0 );\n    return length( pa - ba*h ) - r;\n}\n\n"])

  },
  // XXX No cylinder description
  //` #pragma glslify: sdCylinder	= require('glsl-sdf-primitives/sdCylinder')`
 	HexPrism: {
    parameters:[
      { name:'dimensions', type:'vec2', default:[.8,.6] },
      { name:'center', type:'vec3', default:[0,0,0] },
      { name:'material', type:'mat', default:null }
    ],

    primitiveString( pName ) { 
      return `sdHexPrism( ${pName} - ${this.center.emit()}, ${this.dimensions.emit()} )`
    },
    glslify:glsl(["#define GLSLIFY 1\n      float sdHexPrism( vec3 p, vec2 h )\n{\n    vec3 q = abs(p);\n    return max(q.z-h.y,max((q.x*0.866025+q.y*0.5),q.y)-h.x);\n}\n\n"])
  },   

	Octahedron: {
    parameters:[
      { name:'size', type:'float', default:1 },
      { name:'center', type:'vec3', default:[0,0,0] },
      { name:'material', type:'mat', default:null }
    ],

    primitiveString( pName ) { 
      return `sdOctahedron( ${pName} - ${this.center.emit()}, ${this.size.emit()} )`
    },

    glslify:`    float sdOctahedron(vec3 p, float h) {
    vec2 d = .5*(abs(p.xz)+p.y) - min(h,p.y);
    return length(max(d,0.)) + min(max(d.x,d.y), 0.);
  }`
  }, 

 	Plane: {
    parameters:[
      { name:'normal', type:'vec3', default:[0,1,0] },
      { name:'distance', type:'float', default:1 },
      { name:'material', type:'mat', default:null }
    ],

    primitiveString( pName ) { 
      return `sdPlane( ${pName}, vec4( ${this.normal.emit()}, ${this.distance.emit()} ))`
    },
    
    glslify:glsl(["#define GLSLIFY 1\nfloat sdPlane( vec3 p, vec4 n )\n{\n  // n must be normalized\n  return dot(p,n.xyz) + n.w;\n}\n\n"])
    
  },  
 	Quad: {
    parameters:[
      { name:'v1', type:'vec3', default:[-.5,-.5,0] },
      { name:'v2', type:'vec3', default:[.5,-.5,0] },
      { name:'v3', type:'vec3', default:[.5,.5,0] },
      { name:'v4', type:'vec3', default:[-.5,.5,0] },
      { name:'center', type:'vec3', default:[0,0,0] },
      { name:'material', type:'mat', default:null }
    ],

    primitiveString( pName ) { 
      return `udQuad( ${pName} - ${this.center.emit()}, ${this.v1.emit()}, ${this.v2.emit()}, ${this.v3.emit()}, ${this.v4.emit()} )`
    },
    glslify:glsl(["#define GLSLIFY 1\n    float dot2( in vec3 v ) { return dot(v,v); }\nfloat udQuad( vec3 p, vec3 a, vec3 b, vec3 c, vec3 d )\n{\n    vec3 ba = b - a; vec3 pa = p - a;\n    vec3 cb = c - b; vec3 pb = p - b;\n    vec3 dc = d - c; vec3 pc = p - c;\n    vec3 ad = a - d; vec3 pd = p - d;\n    vec3 nor = cross( ba, ad );\n\n    return sqrt(\n    (sign(dot(cross(ba,nor),pa)) +\n     sign(dot(cross(cb,nor),pb)) +\n     sign(dot(cross(dc,nor),pc)) +\n     sign(dot(cross(ad,nor),pd))<3.0)\n     ?\n     min( min( min(\n     dot2(ba*clamp(dot(ba,pa)/dot2(ba),0.0,1.0)-pa),\n     dot2(cb*clamp(dot(cb,pb)/dot2(cb),0.0,1.0)-pb) ),\n     dot2(dc*clamp(dot(dc,pc)/dot2(dc),0.0,1.0)-pc) ),\n     dot2(ad*clamp(dot(ad,pd)/dot2(ad),0.0,1.0)-pd) )\n     :\n     dot(nor,pa)*dot(nor,pa)/dot2(nor) );\n}\n\n"])
  }, 
  RoundBox: {
    parameters:[
      { name:'size', type:'vec3', default:[1,1,1] },
      { name:'radius', type:'float', default:1 },
      { name:'center', type:'vec3', default:[0,0,0] },
      { name:'material', type:'mat', default:null }
    ],

    primitiveString( pName ) { 
      return `udRoundBox( ${pName} -${this.center.emit()}, ${this.size.emit()},  ${this.radius.emit()} )`
    }, 
    glslify:glsl(["#define GLSLIFY 1\n    float udRoundBox( vec3 p, vec3 b, float r )\n{\n  return length(max(abs(p)-b,0.0))-r;\n}\n\n"])
  }, 
  Sphere:{
    parameters:[
      { name:'radius', type:'float', default:1 },
      { name:'center', type:'vec3', default:[0,0,0] },
      //{ name:'color', type:'float', default:Color(0,0,255) }
      { name:'material', type:'mat', default:null }
    ],

    primitiveString( pName ) { 
      return `sdSphere( ${pName} - ${this.center.emit()}, ${this.radius.emit()} )`
    },
    glslify:glsl(["#define GLSLIFY 1\n    float sdSphere( vec3 p, float s )\n{\n  return length( p ) - s;\n}\n\n"])
  },
  // phi, m, n1, n2, n3, a, b
  SuperFormula:{
    parameters:[
      { name:'m_1', type:'float', default:1 },
      { name:'n1_1', type:'float', default:1 },
      { name:'n2_1', type:'float', default:1 },
      { name:'n3_1', type:'float', default:1 },
      { name:'a_1', type:'float', default:1 },
      { name:'b_1', type:'float', default:1 },
      { name:'m_2', type:'float', default:1 },
      { name:'n1_2', type:'float', default:1 },
      { name:'n2_2', type:'float', default:1 },
      { name:'n3_2', type:'float', default:1 },
      { name:'a_2', type:'float', default:1 },
      { name:'b_2', type:'float', default:1 },
      { name:'center', type:'vec3', default:[0,0,0] },
      { name:'material', type:'mat', default:null }
    ],

    primitiveString( pName ) { 
      return `superformula( ${pName}, ${this.m_1.emit()}, ${this.n1_1.emit()},${this.n2_1.emit()},${this.n3_1.emit()},${this.a_1.emit()},${this.b_1.emit()}, ${this.m_2.emit()}, ${this.n1_2.emit()},${this.n2_2.emit()},${this.n3_2.emit()},${this.a_2.emit()},${this.b_2.emit()} )`
    },
    glslify:glsl(["#define GLSLIFY 1\n    float SuperFormula( float phi, float m, float n1, float n2, float n3, float a, float b ){\n\t\n\tfloat t1 = abs((1.0 / a) * cos(m * phi / 4.0));\n\tt1 = pow(t1, n2);\n\n\tfloat t2 = abs((a / b) * sin(m * phi / 4.0));\n\tt2 = pow(t2, n3);\n\n\tfloat t3 = t1 + t2;\n\n\tfloat r = pow(t3, -1.0 / n1);\n\n\treturn r;\n}\n\n float superformula( vec3 p, float m_1, float n1_1, float n2_1, float n3_1, float a_1, float b_1, float m_2, float n1_2, float n2_2, float n3_2, float a_2, float b_2 ) {\n    float d = length( p );\n    float theta = atan(p.y / p.x);\n    float phi = asin(p.z / d);\n    float r1 = SuperFormula( theta, m_1, n1_1, n2_1, n3_1, a_1, b_1 );\n    float r2 = SuperFormula( phi, m_2, n1_2, n2_2, n3_2, a_2, b_2 );\n    vec3 q = r2 * vec3(r1 * cos(theta) * cos(phi), r1 * sin(theta) * cos(phi), sin(phi));\n    d = d - length(q);\n\n    return d;\n  }    \n",""])

  },
  Torus:{
    parameters:[
      { name:'radii',  type:'vec2', default:[.5,.1] },
      { name:'center', type:'vec3', default:[0,0,0] },
      { name:'material', type:'mat', default:null }
    ],

    primitiveString( pName ) { 
      return `sdTorus( ${pName} - ${this.center.emit()}, ${this.radii.emit()} )`
    },
    glslify:glsl(["#define GLSLIFY 1\n    float sdTorus( vec3 p, vec2 t )\n{\n  vec2 q = vec2(length(p.xz)-t.x,p.y);\n  return length(q)-t.y;\n}\n\n"])

  },  
  Torus88:{
    parameters:[
      { name:'radii',  type:'vec2', default:[.5,.1] },
      { name:'center', type:'vec3', default:[0,0,0] },
      { name:'material', type:'mat', default:null }
    ],

    primitiveString( pName ) { 
      return `sdTorus88( ${pName} - ${this.center.emit()}, ${this.radii.emit()} )`
    },
    glslify:`float sdTorus88( vec3 p, vec2 t ) {
        vec2 q = vec2( length8( p.xz ) - t.x, p.y );
        return length8( q ) - t.y;
      }\n`,
  },
  Torus82:{
    parameters:[
      { name:'radii',  type:'vec2', default:[.5,.1] },
      { name:'center', type:'vec3', default:[0,0,0] },
      { name:'material', type:'mat', default:null }
    ],

    primitiveString( pName ) { 
      return `sdTorus82( ${pName} - ${this.center.emit()}, ${this.radii.emit()} )`
    },
    glslify:`float sdTorus82( vec3 p, vec2 t ) {
        vec2 q = vec2( length( p.xz ) - t.x, p.y );
        return length8( q ) - t.y;
      }\n`
  },
 	Triangle: {
    parameters:[
      { name:'v1', type:'vec3', default:[0,-.5,0] },
      { name:'v2', type:'vec3', default:[-.5,.0,0] },
      { name:'v3', type:'vec3', default:[.5,.0,0] },
      { name:'center', type:'vec3', default:[0,0,0] },
      { name:'material', type:'mat', default:null }
    ],

    primitiveString( pName ) { 
      return `udTriangle( ${pName} - ${this.center.emit()}, ${this.v1.emit()}, ${this.v2.emit()}, ${this.v3.emit()} )`
    },
    glslify:glsl(["#define GLSLIFY 1\n    float dot2( in vec3 v ) { return dot(v,v); }\nfloat udTriangle( vec3 p, vec3 a, vec3 b, vec3 c )\n{\n    vec3 ba = b - a; vec3 pa = p - a;\n    vec3 cb = c - b; vec3 pb = p - b;\n    vec3 ac = a - c; vec3 pc = p - c;\n    vec3 nor = cross( ba, ac );\n\n    return sqrt(\n    (sign(dot(cross(ba,nor),pa)) +\n     sign(dot(cross(cb,nor),pb)) +\n     sign(dot(cross(ac,nor),pc))<2.0)\n     ?\n     min( min(\n     dot2(ba*clamp(dot(ba,pa)/dot2(ba),0.0,1.0)-pa),\n     dot2(cb*clamp(dot(cb,pb)/dot2(cb),0.0,1.0)-pb) ),\n     dot2(ac*clamp(dot(ac,pc)/dot2(ac),0.0,1.0)-pc) )\n     :\n     dot(nor,pa)*dot(nor,pa)/dot2(nor) );\n}\n\n"])
  }, 

  TriPrism: {
    parameters:[
      { name:'dimensions', type:'vec2', default:[.5,.5] },
      { name:'center', type:'vec3', default:[0,0,0] },
      { name:'material', type:'mat', default:null }
    ],

    primitiveString( pName ) { 
      return `sdTriPrism( ${pName} - ${this.center.emit()}, ${this.dimensions.emit()})`
    },
    glslify:glsl(["#define GLSLIFY 1\n      float sdTriPrism( vec3 p, vec2 h )\n{\n    vec3 q = abs(p);\n    return max(q.z-h.y,max(q.x*0.866025+p.y*0.5,-p.y)-h.x*0.5);\n}\n\n"])

  }, 
  VoxelSphere:{
    parameters:[
      { name:'radius', type:'float', default:1 },
      { name:'resolution', type:'float', default:20 },
      { name:'center', type:'vec3', default:[0,0,0] },
      { name:'material', type:'mat', default:null }
    ],

    primitiveString( pName ) { 
      return `VoxelSphere( ${pName} - ${this.center.emit()}, ${this.radius.emit()}, ${this.resolution.emit()} )`
    },
    glslify:glsl(["#define GLSLIFY 1\nfloat sdBox( vec3 p, vec3 b ){\n        vec3 d = abs(p) - b;\n        return min(max(d.x,max(d.y,d.z)),0.0) +\n               length(max(d,0.0));\n      }\n      float VoxelSphere( vec3 p, float radius, float resolution ) {\n        //vec3 ref = p * resolution;\n        //ref = round( ref );\n        //return ( length( ref ) - resolution * radius ) / resolution;\n\n        float dist = round( length( p ) - radius * resolution) / resolution;\n        //if( dist < resolution ) {\n        //  dist = sdBox( vec3(0.), vec3(resolution) );\n        //}\n\n        return dist; \n    }",""])
  },

}

},{"./Color":1,"glslify":24}],17:[function(require,module,exports){
const { Var, float_var_gen, vec2_var_gen, vec3_var_gen, vec4_var_gen, int_var_gen, VarAlloc }  = require( './var.js' )
const SceneNode = require( './sceneNode.js' )
const { param_wrap, MaterialID } = require( './utils.js' )
const Color = require( './color.js' )

const createPrimitives = function( SDF ) {

  const gens = { 
    int:   int_var_gen,
    float: float_var_gen,
    vec2: vec2_var_gen,
    vec3: vec3_var_gen,
    vec4: vec4_var_gen,
    color: Color 
  }

  // load descriptions of all primtives
  const descriptions = require( './primitiveDescriptions.js' )

  const Primitives = {
    descriptions
  }

  for( let name in descriptions ) {
    const desc = descriptions[ name ]
    const params = desc.parameters

    // create constructor
    Primitives[ name ] = function( ...args ) {
      const p = Object.create( Primitives[ name ].prototype )
      p.params = params

      let count = 0

      // wrap each param in a Var object for codegen
      for( let param of params ) {
        if( param.name === 'color' ) {
          p.color = args[ count ] === undefined ? param.default : args[ count++ ]
          continue
        }else if( param.name === 'material' ) {
          p.material = args[ count++ ] || SDF.Material()
          if( SDF.materials.__materials.indexOf( p.material ) === -1 ) {
            SDF.materials.__materials.push( p.material )
          }
          continue
        }
        if( param.type === 'obj' ) {
          let __value = args[ count++ ]
          p[ param.name ] = {
            get value() { return __value },
            set value(v){ __value = v },
            emit() {
              const output =  p[ param.name ].value.emit()
              return output
            },
            emit_decl() {
              return p[ param.name ].value.a.emit_decl() + p[param.name].value.b.emit_decl()
            }
          }
          continue
        }
        const defaultValues = param.default
        const isArray = Array.isArray( defaultValues )

        if( isArray ) {
          let __var =  param_wrap( 
            args[ count++ ], 
            gens[ param.type ]( ...defaultValues ) 
          )

          // for assigning entire new vectors to property
          Object.defineProperty( p, param.name, {
            get() { return __var },
            set(v) {
              __var.set( v )
            }
          })

        }else{
          let __var  = param_wrap( 
            args[ count++ ], 
            gens[ param.type ]( defaultValues ) 
          )

          Object.defineProperty( p, param.name, {
            get() { return __var },
            set(v) {
              __var.set( v )
            }
          })
        }
      }

      // id used for sdf code
      p.id = VarAlloc.alloc()
      //p.color = Color( 255,0,255 )

      // holds operations like scale, rotate, repeat etc.
      p.domainOperations = []

      return p
    }

    // define prototype to use
    Primitives[ name ].prototype = SceneNode()

    // create codegen string
    Primitives[ name ].prototype.emit = function ( __name ) {
      let shaderCode = desc.glslify.indexOf('#') > -1 ? desc.glslify.slice(18) : desc.glslify
      if( SDF.requiredGeometries.indexOf( shaderCode ) === - 1 ) {
        SDF.requiredGeometries.push( shaderCode )
      } 

      if( SDF.memo[ this.id ] !== undefined ) {
        return { preface:'', out:name+this.matId }
      }

      const pname = __name === undefined ? 'p' : __name

      const id = this.material !== undefined ? SDF.materials.materials.indexOf( this.material ) : 0

      const primitive = `        vec2 ${name}${this.id} = vec2(${desc.primitiveString.call( this, pname )}, ${id} );\n`//${this.color.emit()});\n`

      SDF.memo[ this.id ] = name + this.id

      return { preface:primitive, out:name+this.id  }
    }
    
    // declare any uniform variables
    Primitives[ name ].prototype.emit_decl = function() {
      let decl = ''
      for( let param of params ) {
        if( param.name !== 'material' )
          decl += this[ param.name ].emit_decl()
      }
      //decl += this.color.emit_decl()

      return decl
    }

    Primitives[ name ].prototype.update_location = function( gl, program ) {
      for( let param of params ) {
        if( param.type !== 'obj' ) {
          if( param.name !== 'material' ) 
            this[ param.name ].update_location( gl,program )
        }
      }

      //this.color.update_location( gl, program )
    }

    Primitives[ name ].prototype.upload_data = function( gl ) {
      for( let param of params ) {
        if( param.type !== 'obj' && param.name !== 'material' )
          this[ param.name ].upload_data( gl )
      }

      //this.color.upload_data( gl )
    }

  }

  return Primitives
   
}

module.exports = createPrimitives

},{"./color.js":4,"./primitiveDescriptions.js":16,"./sceneNode.js":20,"./utils.js":21,"./var.js":22}],18:[function(require,module,exports){
const glsl = require( 'glslify' )

module.exports = function( variables, scene, preface, geometries, lighting, postprocessing, steps=90, minDistance=.001, maxDistance=20 ) {
    const fs_source = glsl(["     #version 300 es\n      precision highp float;\n#define GLSLIFY 1\n\n     \n      float PI = 3.141592653589793;\n      // Materials should have: color, diffuseColor, specularColor, specularCoefficient, fresnelBias, fresnelPower, fresnelScale\n\n      in vec2 v_uv;\n\n      struct Fresnel {\n        float bias;\n        float scale;\n        float power;\n      };\n\n      struct Light {\n        vec3 position;\n        vec3 color;\n        float attenuation;\n      };\n\n      struct Material {\n        vec3 ambient;\n        vec3 diffuse;\n        vec3 specular;\n        float shininess;\n        Fresnel fresnel;\n      };     \n\n      uniform float time;\n      uniform vec2 resolution;\n      uniform float matTexSize;\n      uniform sampler2D uMatSampler;\n      uniform vec3 camera_pos;\n      uniform vec3 camera_normal;\n\n      ","\n\n      // must be before geometries!\n      float length8( vec2 p ) { \n        return float( pow( pow(p.x,8.)+pow(p.y,8.), 1./8. ) ); \n      }\n\n      /* GEOMETRIES */\n      ","\n\n      vec2 scene(vec3 p);\n\n      // Originally sourced from https://www.shadertoy.com/view/ldfSWs\n// Thank you Iñigo :)\n\nvec2 calcRayIntersection(vec3 rayOrigin, vec3 rayDir, float maxd, float precis) {\n  float latest = precis * 2.0;\n  float dist   = +0.0;\n  float type   = -1.0;\n  vec2  res    = vec2(-1.0, -1.0);\n\n  for (int i = 0; i < "," ; i++) {\n    if (latest < precis || dist > maxd) break;\n\n    vec2 result = scene(rayOrigin + rayDir * dist);\n\n    latest = result.x;\n    type   = result.y;\n    dist  += latest;\n  }\n\n  if (dist < maxd) {\n    res = vec2(dist, type);\n  }\n\n  return res;\n}\n\nvec2 calcRayIntersection(vec3 rayOrigin, vec3 rayDir) {\n  return calcRayIntersection(rayOrigin, rayDir, 20.0, 0.001);\n}\n\n      // Originally sourced from https://www.shadertoy.com/view/ldfSWs\n// Thank you Iñigo :)\n\nvec3 calcNormal(vec3 pos, float eps) {\n  const vec3 v1 = vec3( 1.0,-1.0,-1.0);\n  const vec3 v2 = vec3(-1.0,-1.0, 1.0);\n  const vec3 v3 = vec3(-1.0, 1.0,-1.0);\n  const vec3 v4 = vec3( 1.0, 1.0, 1.0);\n\n  return normalize( v1 * scene ( pos + v1*eps ).x +\n                    v2 * scene ( pos + v2*eps ).x +\n                    v3 * scene ( pos + v3*eps ).x +\n                    v4 * scene ( pos + v4*eps ).x );\n}\n\nvec3 calcNormal(vec3 pos) {\n  return calcNormal(pos, 0.002);\n}\n\n      mat3 calcLookAtMatrix(vec3 origin, vec3 target, float roll) {\n  vec3 rr = vec3(sin(roll), cos(roll), 0.0);\n  vec3 ww = normalize(target - origin);\n  vec3 uu = normalize(cross(ww, rr));\n  vec3 vv = normalize(cross(uu, ww));\n\n  return mat3(uu, vv, ww);\n}\n\nvec3 getRay(mat3 camMat, vec2 screenPos, float lensLength) {\n  return normalize(camMat * vec3(screenPos, lensLength));\n}\n\nvec3 getRay(vec3 origin, vec3 target, vec2 screenPos, float lensLength) {\n  mat3 camMat = calcLookAtMatrix(origin, target, 0.0);\n  return getRay(camMat, screenPos, lensLength);\n}\n\n      float smin(float a, float b, float k) {\n  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);\n  return mix(b, a, h) - k * h * (1.0 - h);\n}\n\n      // OPS\n      float opU( float d1, float d2 )\n{\n    return min(d1,d2);\n}\n\nvec2 opU( vec2 d1, vec2 d2 ){\n\treturn ( d1.x < d2.x ) ? d1 : d2;\n}\n\n      float opI( float d1, float d2 ) {\n        return max(d1,d2);\n      }\n\n      vec2 opI( vec2 d1, vec2 d2 ) {\n        return ( d1.x > d2.x ) ? d1 : d2; //max(d1,d2);\n      }\n\n      /* ******** from http://mercury.sexy/hg_sdf/ ********* */\n\n      float fOpUnionStairs(float a, float b, float r, float n) {\n        float s = r/n;\n        float u = b-r;\n        return min(min(a,b), 0.5 * (u + a + abs ((mod (u - a + s, 2. * s)) - s)));\n      }\n      vec2 fOpUnionStairs(vec2 a, vec2 b, float r, float n) {\n        float s = r/n;\n        float u = b.x-r;\n        return vec2( min(min(a.x,b.x), 0.5 * (u + a.x + abs ((mod (u - a.x + s, 2. * s)) - s))), a.y );\n      }\n\n      // We can just call Union since stairs are symmetric.\n      float fOpIntersectionStairs(float a, float b, float r, float n) {\n        return -fOpUnionStairs(-a, -b, r, n);\n      }\n\n      float fOpSubstractionStairs(float a, float b, float r, float n) {\n        return -fOpUnionStairs(-a, b, r, n);\n      }\n\n      vec2 fOpIntersectionStairs(vec2 a, vec2 b, float r, float n) {\n        return vec2( -fOpUnionStairs(-a.x, -b.x, r, n), a.y );\n      }\n\n      vec2 fOpSubstractionStairs(vec2 a, vec2 b, float r, float n) {\n        return vec2( -fOpUnionStairs(-a.x, b.x, r, n), a.y );\n      }\n\n      float fOpUnionRound(float a, float b, float r) {\n        vec2 u = max(vec2(r - a,r - b), vec2(0));\n        return max(r, min (a, b)) - length(u);\n      }\n\n      float fOpIntersectionRound(float a, float b, float r) {\n        vec2 u = max(vec2(r + a,r + b), vec2(0));\n        return min(-r, max (a, b)) + length(u);\n      }\n\n      float fOpDifferenceRound (float a, float b, float r) {\n        return fOpIntersectionRound(a, -b, r);\n      }\n\n      vec2 fOpUnionRound( vec2 a, vec2 b, float r ) {\n        return vec2( fOpUnionRound( a.x, b.x, r ), a.y );\n      }\n      vec2 fOpIntersectionRound( vec2 a, vec2 b, float r ) {\n        return vec2( fOpIntersectionRound( a.x, b.x, r ), a.y );\n      }\n      vec2 fOpDifferenceRound( vec2 a, vec2 b, float r ) {\n        return vec2( fOpDifferenceRound( a.x, b.x, r ), a.y );\n      }\n\n      float fOpUnionChamfer(float a, float b, float r) {\n        return min(min(a, b), (a - r + b)*sqrt(0.5));\n      }\n\n      float fOpIntersectionChamfer(float a, float b, float r) {\n        return max(max(a, b), (a + r + b)*sqrt(0.5));\n      }\n\n      float fOpDifferenceChamfer (float a, float b, float r) {\n        return fOpIntersectionChamfer(a, -b, r);\n      }\n      vec2 fOpUnionChamfer( vec2 a, vec2 b, float r ) {\n        return vec2( fOpUnionChamfer( a.x, b.x, r ), a.y );\n      }\n      vec2 fOpIntersectionChamfer( vec2 a, vec2 b, float r ) {\n        return vec2( fOpIntersectionChamfer( a.x, b.x, r ), a.y );\n      }\n      vec2 fOpDifferenceChamfer( vec2 a, vec2 b, float r ) {\n        return vec2( fOpDifferenceChamfer( a.x, b.x, r ), a.y );\n      }\n\n      float fOpPipe(float a, float b, float r) {\n        return length(vec2(a, b)) - r;\n      }\n\n      float fOpEngrave(float a, float b, float r) {\n        return max(a, (a + r - abs(b))*sqrt(0.5));\n      }\n\n      float fOpGroove(float a, float b, float ra, float rb) {\n        return max(a, min(a + ra, rb - abs(b)));\n      }\n      float fOpTongue(float a, float b, float ra, float rb) {\n        return min(a, max(a - ra, abs(b) - rb));\n      }\n\n      vec2 fOpPipe( vec2 a, vec2 b, float r ) { return vec2( fOpPipe( a.x, b.x, r ), a.y ); }\n      vec2 fOpEngrave( vec2 a, vec2 b, float r ) { return vec2( fOpEngrave( a.x, b.x, r ), a.y ); }\n      vec2 fOpGroove( vec2 a, vec2 b, float ra, float rb ) { return vec2( fOpGroove( a.x, b.x, ra, rb ), a.y ); }\n      vec2 fOpTongue( vec2 a, vec2 b, float ra, float rb ) { return vec2( fOpTongue( a.x, b.x, ra, rb ), a.y ); }\n\n      vec3 polarRepeat(vec3 p, float repetitions) {\n        float angle = 2.*PI/repetitions;\n        float a = atan(p.z, p.x) + angle/2.;\n        float r = length(p.xz);\n        float c = floor(a/angle);\n        a = mod(a,angle) - angle/2.;\n        vec3 _p = vec3( cos(a) * r, p.y,  sin(a) * r );\n        // For an odd number of repetitions, fix cell index of the cell in -x direction\n        // (cell index would be e.g. -5 and 5 in the two halves of the cell):\n        if (abs(c) >= (repetitions/2.)) c = abs(c);\n        return _p;\n      }\n\n      /* ******************************************************* */\n\n      // added k value to glsl-sdf-ops/soft-shadow\n      float softshadow( in vec3 ro, in vec3 rd, in float mint, in float tmax, in float k ){\n        float res = 1.0;\n        float t = mint;\n\n        for( int i = 0; i < 16; i++ ) {\n          float h = scene( ro + rd * t ).x;\n          res = min( res, k * h / t );\n          t += clamp( h, 0.02, 0.10 );\n          if( h<0.001 || t>tmax ) break;\n        }\n\n        return clamp( res, 0.0, 1.0 );\n      }\n\n      vec2 smin( vec2 a, vec2 b, float k) {\n        float startx = clamp( 0.5 + 0.5 * ( b.x - a.x ) / k, 0.0, 1.0 );\n        float hx = mix( b.x, a.x, startx ) - k * startx * ( 1.0 - startx );\n\n        // material blending... i am proud.\n        float starty = clamp( (b.x - a.x) / k, 0., 1. );\n        float hy = 1. - (a.y + ( b.y - a.y ) * starty); \n\n        return vec2( hx, hy ); \n      }\n\n      float opS( float d1, float d2 ) { return max(-d1,d2); }\n      vec2  opS( vec2 d1, vec2 d2 ) {\n        return -d1.x > d2.x ? vec2( -1. * d1.x, d1.y ) : d2;\n      }\n\n      float opSmoothUnion( float a, float b, float k) {\n        return smin( a, b, k );\n      }\n\n      vec2 opSmoothUnion( vec2 a, vec2 b, float k) {\n        return smin( a, b, k);\n      }\n\n","\n\n      vec2 scene(vec3 p) {\n","\n        return ",";\n      }\n\n      out vec4 col;\n\n      void main() {\n        vec2 pos = v_uv * 2.0 - 1.0;\n        pos.x *= ( resolution.x / resolution.y );\n        vec3 color = bg; \n        vec3 ro = camera_pos;\n\n        //float cameraAngle  = 0.8 * time;\n        //vec3  rayOrigin    = vec3(3.5 * sin(cameraAngle), 3.0, 3.5 * cos(cameraAngle));\n\n        vec3 rd = getRay( ro, camera_normal, pos, 2.0 );\n\n        vec2 t = calcRayIntersection( ro, rd, ",", "," );\n        if( t.x > -0.5 ) {\n          vec3 pos = ro + rd * t.x;\n          vec3 nor = calcNormal( pos );\n\n          color = lighting( pos, nor, ro, rd, t.y ); //;* colorFromInt( t.y );\n        }\n\n        ","\n        \n\n        col = vec4( color, 1.0 );\n      }",""],variables,geometries,steps,lighting,preface,scene,maxDistance,minDistance,postprocessing)

    return fs_source
  }

},{"glslify":24}],19:[function(require,module,exports){
const getFog = require( './fog.js' )
const { param_wrap, MaterialID } = require( './utils.js' )
const __lighting = require( './lighting.js' )
const { Var, float_var_gen, vec2_var_gen, vec3_var_gen, vec4_var_gen, int_var_gen, VarAlloc } = require('./var.js')

const getScene = function( SDF ) {

  Scene = function( objs, canvas, steps=100, minDistance=.001, maxDistance=40, size=2, shouldAnimate=false ) {
    const scene  = Object.create( Scene.prototype )

    MaterialID.clear()
    //VarAlloc.clear()

    SDF.lighting.lights = []
    SDF.materials.materials = SDF.materials.__materials.slice(0)

    Object.assign( scene, { 
      objs, 
      canvas,
      postprocessing:[],
      __shadow:8
    })

    scene.animate( shouldAnimate )
      .steps( steps )
      .threshold( minDistance )
      .farPlane( maxDistance )
      .resolution( size )

    scene.useQuality = true

    return scene
  }

  Scene.prototype = {
    animate( v ) { this.__animate = v; return this },  
    resolution( v ) { 
      this.width = this.canvas.width = window.innerWidth * v
      this.height = this.canvas.height = window.innerHeight * v
      
      this.__resolution = v;
      this.useQuality = false
      return this 
    },  
    threshold( v ) { this.__threshold = v; this.useQuality = false; return this },  
    steps( v ) { this.__steps = v; this.useQuality = false; return this },  
    farPlane( v ) { this.__farPlane = v; this.useQuality = false;  return this },  
    camera( x=0, y=0, z=5 ) {
      Object.assign( SDF.camera.pos, { x,y,z })
      return this
    },
    shadow( k=0 ) {
      this.__shadow = k;
      return this;
    },
    quality( quality=10 ) {
      this.threshold( .1 / (quality * quality * quality ) )
      this.steps( quality * 20 )
      this.farPlane( quality * 20 )
      this.resolution( .2 * quality )

      return this
    },
    light( ...lights ) {
      SDF.lighting.lights = SDF.lighting.lights.concat( lights )
      return this
    },
    fog: getFog( Scene, SDF ),
    background: require( './background.js' )( Scene, SDF ),

    render( quality=10, animate=false ) {
      this.background() // adds default if none has been specified
      if( this.useQuality === true ) {
        this.quality( quality )
      }
      this.animate( animate )

      const lighting = SDF.lighting.gen( this.__shadow )

      const [ variablesDeclaration, sceneRendering, postprocessing ] = SDF.generateSDF( this )

      this.fs = SDF.renderFragmentShader( 
        variablesDeclaration, 
        sceneRendering.out, 
        sceneRendering.preface,
        SDF.requiredGeometries.join('\n'),
        lighting,
        postprocessing, 
        this.__steps, this.__threshold, this.__farPlane.toFixed(1)
      )

      SDF.start( this.fs, this.width, this.height, this.__animate )

      SDF.materials.__materials = []

      this.useQuality = true

      return this
    },

  }

  return Scene

}

module.exports = getScene 

},{"./background.js":2,"./fog.js":9,"./lighting.js":12,"./utils.js":21,"./var.js":22}],20:[function(require,module,exports){
// SceneNode

let SceneNode = ()=> Object.create( SceneNode.prototype )

SceneNode.prototype = {
	emit() { return "#NotImplemented#"; },

	emit_decl() { return ""; },

	update_location(gl, program) {},

	upload_data(gl) {}
}

module.exports = SceneNode

},{}],21:[function(require,module,exports){
const Var = require('./var.js').Var


// Wrapper
function param_wrap( v, __default, name=null ) {
	if( v === undefined || v === null ) return __default()
	if( v.__isVar === true ) return v
	
	return Var( v, name )
}

const MaterialID = {
	current: 0,
	alloc() {
		return MaterialID.current++
  },
  clear() {
    MaterialID.current = 0
  }
}

module.exports = { param_wrap, MaterialID }

},{"./var.js":22}],22:[function(require,module,exports){
const { Vec2, Vec3, Vec4 } = require( './vec.js' )
const float = require( './float.js' )
const int   = require( './int.js' )

// Var
const VarAlloc = {
	current: 0,
  clear() {
    VarAlloc.current = 0
  },
	alloc() {
		return VarAlloc.current++
	}
}

let Var = function( value, fixedName = null ) {
  const v = Object.create( Var.prototype )
	v.varName = fixedName !== null ? fixedName : 'var' + VarAlloc.alloc()
  v.value = value
  v.type = v.value.type
  if( v.type === undefined ) v.type = 'float' 

  value.var = v

  if( v.type !== 'float' && v.type !== 'int' ) {
    Object.defineProperties( v, {
      x: {
        get() { return this.value.x },
        set(v){ this.value.x = v; this.dirty = true }
      },
      y: {
        get() { return this.value.y },
        set(v){ this.value.y = v; this.dirty = true }
      },
      z: {
        get() { return this.value.z },
        set(v){ this.value.z = v; this.dirty = true }
      }
    })
  }/*else{
    let __value = v.value
    Object.defineProperty( v, 'value', {
      get() { return __value },
      set(v){ __value = v; this.dirty = true }
    })
  }*/

  return v
}

Var.prototype = {
	dirty: true,

	loc: -1,

  emit() { 
    let out
    if( this.value.isGen ) {
      const vecOut = this.value.emit() 
      out = vecOut.preface + vecOut.out
        
    }else{
      out = this.varName 
    } 

    return out
  },

  emit_decl() { 
    let out = ''
    if( this.value.isGen ) {
      out = this.value.emit_decl()
    }else{
      out = `uniform ${this.type} ${this.varName};\n`
    }
    return out
  },

	set(v) { this.value = v; this.dirty = true; },

	update_location(gl, program) {
    if( this.value.isGen ) {
      this.value.update_location( gl, program )
      return
    }
		this.loc = gl.getUniformLocation(program, this.varName)
	},	

	upload_data(gl) {
		if( !this.dirty ) return
		
    if( this.value.isGen ) {
      this.value.upload_data( gl  )
      this.dirty = false
      return
    }
		let v = this.value
		if (typeof v === 'number' ) {
			gl.uniform1f( this.loc, v )
		}else if ( v instanceof Vec2 ) {
			gl.uniform2f(this.loc, v.x, v.y )
		} else if( v instanceof Vec3 ) {
			gl.uniform3f(this.loc, v.x, v.y, v.z )
		} else if( v instanceof Vec4 ) {
			gl.uniform4f(this.loc, v.x, v.y, v.z, v.w)
    } else {
      // for color variables
      gl.uniform1f( this.loc, v.x )
    }


		this.dirty = false
	}
}


function int_var_gen(x,name=null) { return ()=> Var( int(x), name ) }

function float_var_gen(x,name=null) { return ()=> Var( float(x), name ) }

function vec2_var_gen(x, y,name=null) { return ()=> Var( Vec2(x, y), name  ) }

function vec3_var_gen(x, y, z,name=null) { return ()=> Var( Vec3(x, y, z), name ) }

function vec4_var_gen(x, y, z, w,name=null) { return Var( Vec4(x, y, z, w ), name ) }

module.exports = { Var, float_var_gen, vec2_var_gen, vec3_var_gen, vec4_var_gen, int_var_gen, VarAlloc }

},{"./float.js":8,"./int.js":11,"./vec.js":23}],23:[function(require,module,exports){
const float = require( './float.js' )

const Vec2 = function (x=0, y=0) {
  const v = Object.create( Vec2.prototype )
  v.x = x; v.y = y

  return v
}

Vec2.prototype = {
  type: 'vec2',
	emit() { return "vec2(" + this.x + "," + this.y + ")" },
	emit_decl() { return ""; }
}

const Vec3 = function (x=0, y, z) {
  const v = Object.create( Vec3.prototype )
  if( y === undefined && z === undefined) {
    v.x = v.y = v.z = x
  }else{
    v.x = x; v.y = y; v.z = z;
  }
  v.isGen = v.x.type === 'string' || v.y.type === 'string' || v.z.type === 'string'
  return v
};

Vec3.prototype = {
  type: 'vec3',
  emit() { 
    let out = `vec3(`
    let preface = ''

    if( this.x.type === 'string' ) {
      const xout = this.x.emit()
      out += xout.out + ','
    }else{
      out += this.x + ','
    }

    if( this.y.type === 'string' ) {
      const yout = this.y.emit()
      out += yout.out + ',' 
    }else{
      out += this.y + ','
    }
    if( this.z.type === 'string' ) {
      const zout = this.z.emit()
      out += zout.out
    }else{
      out += this.z 
    }

    out += ')'

    return { out, preface }
  },
  emit_decl() { 
    let out = ''
    if( this.x.type === 'string' ) {
      out += this.x.emit_decl()
    } 
    if( this.y.type === 'string' && this.x !== this.y  ) {
      out += this.y.emit_decl()
    } 
    if( this.z.type === 'string' && this.z !== this.y && this.z !== this.x ) {
      out += this.z.emit_decl()
    } 
    return out
  },

	update_location(gl, program) {
    if( this.isGen ) {
      if( this.x.type === 'string' ) {
        this.x.update_location(gl,program)
      } 
      if( this.y.type === 'string' && this.x !== this.y  ) {
        this.y.update_location(gl,program)
      } 
      if( this.z.type === 'string' && this.z !== this.y && this.z !== this.x ) {
        this.z.update_location(gl,program)
      }      
    }
  },
  
  upload_data(gl) {
    if( this.isGen ) {
      if( this.x.type === 'string' ) {
        this.x.upload_data(gl)
      } 
      if( this.y.type === 'string' && this.x !== this.y  ) {
        this.y.upload_data(gl)
      } 
      if( this.z.type === 'string' && this.z !== this.y && this.z !== this.x ) {
        this.z.upload_data(gl)
      }      
    }
  }

}

// Vec4

let Vec4 = function (x, y, z, w) {
  const v = Object.create( Vec4.prototype )
  v.x = x; v.y = y; v.z = z; v.w = w

  return v
};

Vec4.prototype = {
  type: 'vec4',
	emit() { return "vec4(" + this.x + "," + this.y + "," + this.z + "," + this.w + ")"; },
	emit_decl() { return ""; }
}





module.exports = { Vec2, Vec3, Vec4 } 

},{"./float.js":8}],24:[function(require,module,exports){
module.exports = function(strings) {
  if (typeof strings === 'string') strings = [strings]
  var exprs = [].slice.call(arguments,1)
  var parts = []
  for (var i = 0; i < strings.length-1; i++) {
    parts.push(strings[i], exprs[i] || '')
  }
  parts.push(strings[i])
  return parts.join('')
}

},{}]},{},[10]);
