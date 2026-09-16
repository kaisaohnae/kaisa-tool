const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const assert = require('node:assert/strict');
const retouch = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/modules/photo/retouch.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports:retouch});
function canvas(width=12,height=12) {
  const data=new Uint8ClampedArray(width*height*4);
  for(let y=0;y<height;y++) for(let x=0;x<width;x++) {
    const i=(y*width+x)*4;
    data[i]=data[i+1]=data[i+2]=x%2 ? 255:0;
    data[i+3]=255;
  }
  const ctx={getImageData(x,y,w,h){const result=new Uint8ClampedArray(w*h*4);for(let yy=0;yy<h;yy++)for(let xx=0;xx<w;xx++)result.set(data.subarray(((y+yy)*width+x+xx)*4,((y+yy)*width+x+xx)*4+4),(yy*w+xx)*4);return {width:w,height:h,data:result};},putImageData(image,x,y){for(let yy=0;yy<image.height;yy++)for(let xx=0;xx<image.width;xx++)data.set(image.data.subarray((yy*image.width+xx)*4,(yy*image.width+xx)*4+4),((y+yy)*width+x+xx)*4);}};
  return {width,height,data,getContext:()=>ctx};
}
const brush={size:10,hardness:100,strength:100};
const image=canvas();
retouch.applyRetouchStamp(image,6,6,'blurTool',brush);
assert(image.data[(6*12+6)*4]>0);
assert(image.data[(6*12+7)*4]<255);
for(let i=3;i<image.data.length;i+=4) assert.equal(image.data[i],255);
const edge=canvas();retouch.applyRetouchStamp(edge,0,0,'blurTool',brush);assert(edge.data[0]>0);
const untouched=canvas(), before=new Uint8ClampedArray(untouched.data);retouch.applyRetouchStamp(untouched,6,6,'blurTool',{...brush,strength:0});assert.deepEqual(untouched.data,before);
const masked=canvas(), original=new Uint8ClampedArray(masked.data);const mask={getContext:()=>({getImageData:(x,y,w,h)=>({data:new Uint8ClampedArray(w*h*4)})})};retouch.applyRetouchStamp(masked,6,6,'blurTool',{...brush,mask});assert.deepEqual(masked.data,original);
const stroke=canvas();retouch.applyRetouchStroke(stroke,2,6,10,6,'blurTool',brush);assert(stroke.data[(6*12+8)*4]>0);
console.log('PASS: visible blur, image edges, alpha preservation, zero strength, selection mask, continuous stroke');