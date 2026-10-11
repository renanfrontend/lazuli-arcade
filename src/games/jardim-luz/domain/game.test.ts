import {describe,expect,it} from 'vitest';
import {awakenFlower,BUDS,createGarden,flowersAwake,nurtureGarden,restoreGarden} from './game';
describe('Jardim de Luz',()=>{
  it('nurtures only flowers near the gesture and keeps partial progress',()=>{let s=createGarden();const p=BUDS[0]??{x:0,y:0};s=nurtureGarden(s,p,.1);expect(s.growth[0]).toBeGreaterThan(0);expect(s.growth[1]).toBe(0);expect(nurtureGarden(s,null,1)).toBe(s);});
  it('opens all flowers without a timer, score penalty or loss state',()=>{let s=createGarden();for(const p of BUDS)for(let frame=0;frame<15;frame++)s=nurtureGarden(s,p,.1);expect(flowersAwake(s)).toBe(6);expect(nurtureGarden(s,BUDS[0]??null,10)).toBe(s);});
  it('supports keyboard cultivation without duplicate flowers',()=>{const s=createGarden(),next=awakenFlower(s,2);expect(flowersAwake(next)).toBe(1);expect(awakenFlower(next,2)).toBe(next);expect(awakenFlower(s,-1)).toBe(s);expect(awakenFlower(s,99)).toBe(s);expect(flowersAwake(s)).toBe(0);});
  it('restores saved progress and sanitizes damaged data',()=>{const s=awakenFlower(createGarden(),3);expect(restoreGarden(s)).toEqual(s);expect(restoreGarden({growth:[1]})).toEqual(createGarden());expect(restoreGarden({growth:[NaN,-1,2,'x',.5,1]}).growth).toEqual([0,0,1,0,.5,1]);});
  it('rejects non-finite or negative time, and caps long frame gaps',()=>{const s=createGarden(),p=BUDS[0]??null;expect(nurtureGarden(s,p,NaN)).toBe(s);expect(nurtureGarden(s,p,-1)).toBe(s);expect(nurtureGarden(s,p,100)).toEqual(nurtureGarden(s,p,.1));});
});
