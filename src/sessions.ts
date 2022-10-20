//import murmur from 'murmurhash-js'

import { Rollout, Session } from './types'

export function parseSession (namespace: string, id: string, value: string): Session {
  return {
    namespace,
    id,
    flags: JSON.parse(value)
  }
}

// export function resolveState_no_traits (rollouts: Rollout[], timestamp: number, sessionId: string): boolean {
//   if (!rollouts || rollouts.length === 0) {
//     return false
//   }

//   const param = murmur.murmur3(`${sessionId}${timestamp}`) % 100

//   const rollout = rollouts.find(r =>
//     r.percentage === undefined
//       ? r.value
//       : param <= r.percentage
//   )

//   return (rollout && rollout.value) || false
// }

const hashCode = function(str:string) {
  var hash = 0,
    i, chr;
  if (str.length === 0) return hash;
  for (i = 0; i < str.length; i++) {
    chr = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
}

export function resolveState (rollouts: Rollout[], timestamp: number, sessionId: string, sessionTraits: string[] = []): boolean {
  if (!rollouts || rollouts.length === 0) {
    return false
  }

  const param = Math.abs(hashCode(`${sessionId}${timestamp}`)) % 100;
  // the strategy for session traits to rollout traits matches: 
  // * both traits are string[], the match can be multi to multi.  
  // a match means all of the rollout traits are found in the session traits (i.e. give rollout traits ["a","b","c"], session traits ["a","b","c"] and ["a","b","c","d"] will match but session traits ["a","b"] do not)
  // the more array member matches has higher precedence: 
  // (i.e. session traits ["a","b","c"], will match rollout traits ["a","b","c"] and ["a","b"], but rollout traits ["a","b","c"] will have higher precendence because it is more specific match
  // if multiple Rollout traits match a session traits, {"value":false} take precedence (so you can ensure a feature matches the traits can be turned off)
  // if multiple Rollout traits of {"value":false} match, the highest value of percentage takes precedence. 
  // {"value":true} Rollout traits with same level of precendence will only be considered if no false traits matches at this specificity
  // if no traits matching rollout strategy found, then consider strategies do not have traits ()

  // Examples: 
  //  when the session has traits ["blue", "square", "plastic"], it will match rollout strategies that has traits: ["blue"], or ["blue","square"] or ["blue", "square", "plastic"], 
  //  however, a rollout strategy traits:["blue", "square", "metal"] will NOT match this session
  //  so if you want both "blue" and "red" to be considered, they shall be 2 different rollout strategies, not listed as traits:["blue","red"], because this will only match sessions have traits:["blue","red"...]
  let no_of_traits = -1;
  let rollout_percentage = rollouts.reduce( 
    (pv, cro) => {
      if ( cro.traits == null || cro.traits?.reduce((tpv, tcv) => {return tpv && sessionTraits.includes(tcv)}, (1==1)) ) { // if all traits of a Rollout  are found in session traits
        if ( (cro.traits?.length ?? 0) > no_of_traits ) { // if this Rollout strategy has more specific matching than previous ones use this percentage value (default is 100)
          no_of_traits = (cro.traits?.length ?? 0); 
          if ( cro.value ) { 
            return (typeof cro.percentage === 'number' )? cro.percentage : 100 ;
          } else { // if this is a "turn off" strategy, turn the percentage to a negative number, 
            return (typeof cro.percentage === 'number' )? -cro.percentage : -100 ;
          }
        } else if ((cro.traits?.length ?? 0 ) == no_of_traits  ) { // if equal #_of_matching traits, false take precedence, then larger percentage value
          if ( cro.value == false ) {
            return Math.min( pv, (typeof cro.percentage === 'number' )? -cro.percentage : -100 );
          } else { 
            if (pv >= 0) { // if this is true, then only change the value if previous percentage is positive (meaning no false rules have applied yet at this specifity level)
              return Math.max( pv, (typeof cro.percentage === 'number' )? cro.percentage : 100 );
            }
          }
        }
      };
      return pv;
    }
    ,0
  )
  
  // default is false
  return (param * Math.sign(1/rollout_percentage) < rollout_percentage ) || false
}