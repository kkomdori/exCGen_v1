/**---------------------------------------------------------------------------------------
 * @NN_parameters Allawi HT, SantaLucia J Jr. biochemistry (1997) (DOI: 10.1021/bi962590c)
 * This free energy parameters has been evaluated at 37'C, 1M NaCl.
 */
const aa = -1;
const AT = -0.88;
const TA = -0.58;
const CA = -1.45;
const GT = -1.44;
const CT = -1.28;
const GA = -1.3;
const CG = -2.17;
const GC = -2.24;
const GG = -1.84;
const terGCp = 0.98;
const terATp = 1.03;
const penaltySelf = 0.43; //adjust it to the cases for hairpin and self-annealing
//---------------------------------------------------------------------------------------

const globalBurlge = 3;
const globalHairpinLoop = 7;
const StepOffset = 2; // Reduction in the terminal comparison step, considering the length deviation due to bulge sequence creation.

var toggle = "on";
var targetObj = []; // Store randomly generated sequences
var targetGC = []; //gc_distributor(num_pairs, gc_min, gc_max);

var dG_Obj = []; // Store gate pass values
var passObj = []; // Store final sequence information

var count = 0;
var failed = 0;
var completion = 0;
var Gate_dG_hairpin = 0;
var Gate_dG_self = 0;
var Gate_dG_selected = 0;
var Gate_dG_passed = 0;

function main() {
  // Slow speed, but controllable; main(){setTimeout(){loop; setTimeout(){main}}}
  draw(); // Reflect on the status window

  setTimeout(() => {
    if (completion < num_pairs && toggle == "on") {
      // console.log("queue");
      count++;

      targetObj = sequenceMaker(preset_seq, targetGC[completion]); // Sequence generation
      Object.assign(targetObj, { duplex: cal_dG(targetObj.plus, targetObj.minus).toFixed(2) });
      //{ plus: pStrand_str, minus: complement(pStrand.reverse().join("")), gcr: pStrand_GC };

      // Receive each dG threshold by dividing the dG of the Duplex from the set value
      var thresholdOfHair_dG = (thresholdOfHair_dGper * Number(targetObj.duplex)) / 100;
      var thresholdOfCross_dG = (thresholdOfCross_dGper * Number(targetObj.duplex)) / 100;
      var thresholdOfSelected_dG = (thresholdOfSelected_dGper * Number(targetObj.duplex)) / 100;

      if (Gate_Ex(targetObj.plus, targetObj.minus, avoids) == false) {
        failed++;
      } else if ((dG_Obj.hair = Gate_dG_hair(targetObj.plus, thresholdOfHair_dG)) == false) {
        failed++;
      } else if ((dG_Obj.cross = Gate_dG_cross(targetObj.plus, targetObj.minus, thresholdOfCross_dG, thresholdOfSelected_dG, completion)) == false) {
        failed++;
      } else {
        Object.assign(targetObj, dG_Obj); // Add properties of dG_Obj to targetObj
        passObj.push(targetObj);
        completion++;
      }
      setTimeout(main, 0);
    } else {
      console.log("completion: " + completion + ", fail : " + failed);
      report(passObj, selected);
    }
  }, 0);
}

function report(resultObj, selectedObj) {

  if (completion == num_pairs) {
    var now = new Date();
    document.getElementById("end").innerHTML = now.toLocaleString(); // Store end time
    inputActivaton(false);
  }

  drawTable(resultObj, selectedObj)
  heatmapForHairpin(num_pairs, completion, resultObj, thresholdOfHair_dGper);
  heatmapForCrossPairs(num_pairs, completion, resultObj, thresholdOfCross_dGper);
  heatmapForSelected(num_pairs, completion, resultObj, selectedObj, thresholdOfSelected_dGper);
}

function gc_distributor(pairs_amount, minGC, maxGC) {
  // Returns an array containing GC % values sorted in ascending order by the number of fragments
  var gcD = [];
  var gcGap;

  gcGap = (maxGC - minGC) / (pairs_amount - 1);

  for (var i = 0; i < pairs_amount; i++) {
    gcD[i] = minGC + gcGap * i;
  }
  return gcD;
}

function sequenceMaker(preset_str, GC_ratio = 50, tolerance = 2.5) {
  // Create a sequence that matches the given GC ratio. tolerance determines whether to allow for an error margin.

  var pStrand = [];
  var arr = [];

  const arrATGC = ["A", "T", "G", "C"];
  const arrATATGC = ["A", "T", "A", "T", "A", "T", "G", "C", "G", "C"];
  const arrATGCGC = ["A", "T", "A", "T", "G", "C", "G", "C", "G", "C"];
  const arrR = ["A", "G"];
  const arrY = ["T", "C"];
  const arrS = ["G", "C"];
  const arrW = ["A", "T"];

  // Apply basepool according to GC contents
  if (GC_ratio <= 45) {
    arr = arrATATGC;
  } else if (GC_ratio > 55) {
    arr = arrATGCGC;
  } else {
    arr = arrATGC;
  }

  // Reflect preset
  var n = 0;
  do {
    for (var i = 0; i < preset_str.length; i++) {
      switch (preset_str.substr(i, 1)) {
        case "*":
          pStrand[i] = arr[Math.floor(Math.random() * arr.length)];
          break;
        case "A":
        case "T":
        case "G":
        case "C":
          pStrand[i] = preset_str.substr(i, 1);
          break;
        case "R":
          pStrand[i] = arrR[Math.floor(Math.random() * arrR.length)];
          break;
        case "Y":
          pStrand[i] = arrY[Math.floor(Math.random() * arrY.length)];
          break;
        case "S":
          pStrand[i] = arrS[Math.floor(Math.random() * arrS.length)];
          break;
        case "W":
          pStrand[i] = arrW[Math.floor(Math.random() * arrW.length)];
          break;
        default:
          console.log("Wrong character has been inserted in preset bases.");
          return;
      }
    }

    // After GC validation, add the minus sequence information of the passing sequence and return
    var pStrand_str = pStrand.join("");
    var pStrand_GC = (pStrand_str.replace(/[^GC]/gi, "").length * 100) / pStrand_str.length;
    if (pStrand_GC >= GC_ratio - tolerance && pStrand_GC <= GC_ratio + tolerance) {
      return { plus: pStrand_str, minus: complement(pStrand.reverse().join("")), gcr: pStrand_GC };
    } else {
      n++;
    }
  } while (n < 1000);
  alert("Please check the value of GC and preset bases are in the proper range.");
}


function complement(str) {
  str = str.replace(/A/gi, "1");
  str = str.replace(/T/gi, "A");
  str = str.replace(/1/gi, "T");
  str = str.replace(/C/gi, "1");
  str = str.replace(/G/gi, "C");
  str = str.replace(/1/gi, "G");

  return str;
}

function reverseString(str) {
  var reversedStr = str.split("").reverse().join(""); 
  return reversedStr; 
}


function Gate_Ex(plusStrand, minusStrand, exceptObj) {
  // Use a loop to check if plusStrand and minusStrand have parts that match each exclusion sequence
  // If a matching sequence is found, return False and terminate the function. If no part matches any exceptional sequence, return True.

  // If there is no input exclusion sequence, return True and terminate the function
  if (exceptObj.join("").trim() == "") {
    return true;
  }
  for (var i = 0, len = exceptObj.length; i < len; i++) {
    if (exceptObj[i].seq == "") {
      continue;
    } else if (plusStrand.includes(exceptObj[i].seq) == true || minusStrand.includes(exceptObj[i].seq) == true) {
      return false; // Reject
    }
  }
  return true;
}

function hairpinMaker(inputSeq, hairpinLength = 4, startPos = 3, slice = "on") {
  // Returns the left and right strands, separated by hairpin formation, as an array of objects
  // Returns the sequence tailored with the slice option

  var hairpinSeq = []; //{left: leftPart, right: rightPart}
  for (var h = 3; h <= hairpinLength; h++) {
    // Apply from hairpin loop 3mer
    for (var i = 0, len = inputSeq.length; i <= len - (h + 2 * startPos); i++) {
      if (slice == "on") {
        // Returns the sequences to the left and right of the loop, tailored to the same length
        hairpinSeq[hairpinSeq.length] = {
          left: inputSeq.substr(0, i + startPos).slicer(inputSeq.substr(i + startPos + h)),
          right: inputSeq.substr(i + startPos + h).slicer(inputSeq.substr(0, i + startPos)),
        };
      } else {
        hairpinSeq[hairpinSeq.length] = { left: inputSeq.substr(0, i + startPos), right: inputSeq.substr(i + startPos + h) };
      }
    }
  }
  return hairpinSeq;
}

function burlgeMaker(inputSeq, burlgeLength = 3, startPos = 3) {
  // Cut the input sequence by the bulge length and concatenate the front and back parts
  // When inputSeq is 10mer, bulgeLength=1, startPos=3,
  // burlgeSeq[1] = inputSeq[0~2] + inputSeq[4~9]; start
  // burlgeSeq[4] = inputSeq[0~5] + inputSeq[7~9]; end
  // bulge 3 includes the results of bulge 0, 1, and 2.

  var burlgeSeq = [];
  burlgeSeq[0] = inputSeq; // The first sequence has no bulge

  for (var h = 1; h <= burlgeLength; h++) {
    for (var i = 0; i <= inputSeq.length - (h + 2 * startPos); i++) {
      // bulgeSeq[0] is the inputSeq with no bulge
      burlgeSeq[burlgeSeq.length] = inputSeq.insertStr(i + startPos, "", h);
    }
  }
  return burlgeSeq;
}

/**
 * @param {string} index  target sequence
 * @param {string} char   characters to be inserted
 * @param {number} range  index range to be exchanged for char
 * @returns
 */
String.prototype.insertStr = function (index, char, range = 0) {
  // Function to insert a character at a specific index in a string; can be used for replacement
  // range=0, insertion; range=1, replace one existing character with char.
  return this.substr(0, index) + char + this.substr(index + range);
};

String.prototype.slicer = function (parallelSeq, step = "off") {
  //sliding algorithm (Peter M. Vallone, BioTechniques, 2004)

  // For a specific string, receive a comparison string and tailor it according to the comparison order (step). Direction is 5'->3'
  // 1. Determine if the input sequence is short or long. 2. Sequence tailoring according to the step of the sliding comparison algorithm
  // 2-1. when step <= short; 2-2. when short < step <= long; 2-3. when step > long

  var short;
  var long;
  var slicedSeq;
  var c;

  if (this.length < parallelSeq.length) {
    short = this.length;
    long = parallelSeq.length;
    c = 1;
  } else if (this.length > parallelSeq.length) {
    short = parallelSeq.length;
    long = this.length;
    c = 2;
  } else if ((this.length = parallelSeq.length)) {
    short = this.length; //short = long
    c = 3;
  }

  if (step == "off") {
    step = short;
  }

  switch (c) {
    case 1:
      if (step <= short) {
        slicedSeq = this.substr(0, step); // Cut according to the basic step length
      } else if (short < step && step <= long) {
        slicedSeq = this.substr(0, short);
        // If the comparison step exceeds the short length, cut according to the short length
      } else {
        //step > long
        slicedSeq = this.substr(step - long, short - (step - long));
      }
    case 2:
      if (step <= short) {
        slicedSeq = this.substr(0, step);
      } else if (short < step && step <= long) {
        slicedSeq = this.substr(step - short, short);
      } else {
        slicedSeq = this.substr(step - short, short - (step - long));
      }
    case 3:
      if (step <= short) {
        slicedSeq = this.substr(0, step);
      } else if (short < step && step < 2 * short) {
        slicedSeq = this.substr(step - short, short - (step - short));
      }
  }
  return slicedSeq;
};

function cal_dG(sliceNew, sliceOld) {
  // If two sequences of the same length are passed, they are converted into an alphabet array and paired to calculate the dG value

  // Handle spaces as exceptions
  if (sliceNew == "" || sliceOld == "") {
    return 0;
  }

  var pairingLen = sliceNew.trim().length;

  // Convert splicedSeq to an alphabet array
  var spNew = [];
  var spOld = [];
  var spOld_rev = []; // Convert the comparison sequence from 3' to 5'

  for (var i = 0; i < pairingLen; i++) {
    spNew[i] = sliceNew.substr(i, 1);
    spOld[i] = sliceOld.substr(i, 1);
    spOld_rev[pairingLen - (i + 1)] = spOld[i];
  }

  var pairing = []; // Array to store match, mismatch results (pair)
  var pairResult = "";
  var pair = "";

  for (var i = 0; i < pairingLen; i++) {
    pair = spNew[i] + spOld_rev[i];

    switch (pair) {
      case "AT":
        pairing[i] = "a";
        break;
      case "TA":
        pairing[i] = "b";
        break;
      case "GC":
        pairing[i] = "c";
        break;
      case "CG":
        pairing[i] = "d";
        break;
      default:
        pairing[i] = "x";
    }
  }

  // Add spaces to the first and last characters of pairResult, for adjusting nearest neighbor model
  pairResult = "_" + pairing.join("") + "_";

  var NN = "";
  var dG = 0;

  // Read 2 characters from the left of the pairResult string, with a 1-character overlap.
  for (var i = 0; i < pairResult.length; i++) {
    NN = pairResult.substr(i, 2);

    switch (NN) {
      case "aa":
      case "bb":
        dG = dG + aa;
        break;
      case "ab":
        dG = dG + AT;
        break;
      case "ba":
        dG = dG + TA;
        break;
      case "ad":
      case "da":
        dG = dG + CA;
        break;
      case "cb":
      case "bc":
        dG = dG + GT;
        break;
      case "db":
      case "bd":
        dG = dG + CT;
        break;
      case "ca":
      case "ac":
        dG = dG + GA;
        break;
      case "dc":
        dG = dG + CG;
        break;
      case "cd":
        dG = dG + GC;
        break;
      case "cc":
      case "dd":
        dG = dG + GG;
        break;
      case "_c":
      case "_d":
      case "c_":
      case "d_":
        dG = dG + terGCp;
        break;
      case "_a":
      case "_b":
      case "a_":
      case "b_":
        dG = dG + terATp;
        break;
      default:
        dG = dG;
    }
  }

  return dG;
}

function Gate_dG_hair(NewPlusStrand, threshold) {
  var dG_HairNPlus = 0;
  var lowest_dG_HairNPlus = 0;
  var hairNPlus = [];

  // Hairpin generation. Compare only the plus strand. The result is the same as the minus strand.
  hairNPlus = hairpinMaker(NewPlusStrand, globalHairpinLoop, 3); //default: slice="on"
  // { left: inputSeq.substr(0, i + startPos), right: inputSeq.substr(i + startPos + h) }

  for (var i = 0; i < hairNPlus.length; i++) {
    dG_HairNPlus = cal_dG(hairNPlus[i].right, hairNPlus[i].left) + penaltySelf;
    //0.43 kcal/mol is penalty of self-complementary structure

    if (lowest_dG_HairNPlus > dG_HairNPlus) {
      lowest_dG_HairNPlus = dG_HairNPlus; //dG_HairNPlus = dG_HairNMinus
    }
  }

  if (threshold > lowest_dG_HairNPlus) {
    return false; // Reject if a hairpin is formed more stably than the threshold.
  } else {
    // console.log("Gate_dG_hairpin: pass");
    Gate_dG_hairpin++;
    return lowest_dG_HairNPlus.toFixed(2);
  }
}

function Gate_dG_cross(NewPlusStrand, NewMinusStrand, threshold, threshold_selected, passedNum = 0) {

  //Self-dimer check======================================
  var lowest_dG_SelfNPlus = 0;
  var lowest_dG_SelfNMinus = 0;

  var dG_dimerNPlusVsNPlus = 0;
  var dG_dimerNMinusVsNMinus = 0;

  var NPvsSelf = 0;
  var NMvsSelf = 0;

  // Bulge sequence generation
  var B_newPlus = burlgeMaker(NewPlusStrand, globalBurlge);
  var B_newMinus = burlgeMaker(NewMinusStrand, globalBurlge);

  for (var k = 0, len = B_newPlus.length; k < len; k++) {
    for (var j = StepOffset, len2 = B_newPlus[k].length; j < len2 - StepOffset; j++) {
      dG_dimerNPlusVsNPlus = cal_dG(B_newPlus[k].slicer(NewPlusStrand, j), NewPlusStrand.slicer(B_newPlus[k], j)) + penaltySelf;
      dG_dimerNMinusVsNMinus = cal_dG(B_newMinus[k].slicer(NewMinusStrand, j), NewMinusStrand.slicer(B_newMinus[k], j)) + penaltySelf;

      //heatmap data refresh
      if (NPvsSelf > dG_dimerNPlusVsNPlus) {
        NPvsSelf = dG_dimerNPlusVsNPlus;
      }
      if (NMvsSelf > dG_dimerNMinusVsNMinus) {
        NMvsSelf = dG_dimerNMinusVsNMinus;
      }

      //for gating
      if (lowest_dG_SelfNPlus > dG_dimerNPlusVsNPlus) {
        lowest_dG_SelfNPlus = dG_dimerNPlusVsNPlus;
      }
      if (lowest_dG_SelfNMinus > dG_dimerNMinusVsNMinus) {
        lowest_dG_SelfNMinus = dG_dimerNMinusVsNMinus;
      }
    }
  }
  if (threshold > lowest_dG_SelfNPlus || threshold > lowest_dG_SelfNMinus) {
    return false;
  } else {
    Gate_dG_self++;
  }
  //Self-dimer check=======================================end
  //dimer with other plus and minus==============================

  var lowest_dG_HeteroNPlusVsPlus = 0;
  var lowest_dG_HeteroNPlusVsMinus = 0;
  var lowest_dG_HeteroNMinusVsPlus = 0;
  var lowest_dG_HeteroNMinusVsMinus = 0;

  var dG_dimerNPlusVsPlus = 0;
  var dG_dimerNPlusVsMinus = 0;
  var dG_dimerNMinusVsPlus = 0;
  var dG_dimerNMinusVsMinus = 0;

  var NPvsPass = [];
  var NMvsPass = [];

  if (passedNum > 0) {
    // Start checking from passedNum > 0, i.e., the first round is excluded from the check as there is no previously generated sequence

    //bulge new vs complete
    for (var i = 0; i < passedNum; i++) {
      NPvsPass[i] = { t: i, p: 0, m: 0 };
      NMvsPass[i] = { t: i, p: 0, m: 0 };

      for (var k = 0, len = B_newPlus.length; k < len; k++) {
        for (var j = StepOffset, len2 = B_newPlus[k].length; j < len2 - StepOffset; j++) {
          dG_dimerNPlusVsPlus = cal_dG(B_newPlus[k].slicer(passObj[i].plus, j), passObj[i].plus.slicer(B_newPlus[k], j));
          dG_dimerNPlusVsMinus = cal_dG(B_newPlus[k].slicer(passObj[i].minus, j), passObj[i].minus.slicer(B_newPlus[k], j));
          dG_dimerNMinusVsPlus = cal_dG(B_newMinus[k].slicer(passObj[i].plus, j), passObj[i].plus.slicer(B_newMinus[k], j));
          dG_dimerNMinusVsMinus = cal_dG(B_newMinus[k].slicer(passObj[i].minus, j), passObj[i].minus.slicer(B_newMinus[k], j));

          //heatmap data refresh
          if (NPvsPass[i].p > dG_dimerNPlusVsPlus) {
            NPvsPass[i].p = dG_dimerNPlusVsPlus;
          }
          if (NPvsPass[i].m > dG_dimerNPlusVsMinus) {
            NPvsPass[i].m = dG_dimerNPlusVsMinus;
          }
          if (NMvsPass[i].p > dG_dimerNMinusVsPlus) {
            NMvsPass[i].p = dG_dimerNMinusVsPlus;
          }
          if (NMvsPass[i].m > dG_dimerNMinusVsMinus) {
            NMvsPass[i].m = dG_dimerNMinusVsMinus;
          }

          //for gating
          if (lowest_dG_HeteroNPlusVsPlus > dG_dimerNPlusVsPlus) {
            lowest_dG_HeteroNPlusVsPlus = dG_dimerNPlusVsPlus;
          }
          if (lowest_dG_HeteroNPlusVsMinus > dG_dimerNPlusVsMinus) {
            lowest_dG_HeteroNPlusVsMinus = dG_dimerNPlusVsMinus;
          }
          if (lowest_dG_HeteroNMinusVsPlus > dG_dimerNMinusVsPlus) {
            lowest_dG_HeteroNMinusVsPlus = dG_dimerNMinusVsPlus;
          }
          if (lowest_dG_HeteroNMinusVsMinus > dG_dimerNMinusVsMinus) {
            lowest_dG_HeteroNMinusVsMinus = dG_dimerNMinusVsMinus;
          }
        }
      }
      if (threshold > lowest_dG_HeteroNPlusVsPlus || threshold > lowest_dG_HeteroNPlusVsMinus || threshold > lowest_dG_HeteroNMinusVsPlus || threshold > lowest_dG_HeteroNMinusVsMinus) {
        return false;
      }
    }

    //bulge complete vs new
    var B_passedPlus = [];
    var B_passedMinus = [];

    for (var i = 0; i < passedNum; i++) {
      B_passedPlus[i] = burlgeMaker(passObj[i].plus, globalBurlge);
      B_passedMinus[i] = burlgeMaker(passObj[i].minus, globalBurlge);
      for (var k = 0, len = B_passedPlus[i].length; k < len; k++) {
        for (var j = StepOffset, len2 = B_passedPlus[i][k].length; j < len2 - StepOffset; j++) {
          dG_dimerNPlusVsPlus = cal_dG(NewPlusStrand.slicer(B_passedPlus[i][k], j), B_passedPlus[i][k].slicer(NewPlusStrand, j));
          dG_dimerNPlusVsMinus = cal_dG(NewPlusStrand.slicer(B_passedMinus[i][k], j), B_passedMinus[i][k].slicer(NewPlusStrand, j));
          dG_dimerNMinusVsPlus = cal_dG(NewMinusStrand.slicer(B_passedPlus[i][k], j), B_passedPlus[i][k].slicer(NewMinusStrand, j));
          dG_dimerNMinusVsMinus = cal_dG(NewMinusStrand.slicer(B_passedMinus[i][k], j), B_passedMinus[i][k].slicer(NewMinusStrand, j));

          //heatmap data refresh
          if (NPvsPass[i].p > dG_dimerNPlusVsPlus) {
            NPvsPass[i].p = dG_dimerNPlusVsPlus;
          }
          if (NPvsPass[i].m > dG_dimerNPlusVsMinus) {
            NPvsPass[i].m = dG_dimerNPlusVsMinus;
          }
          if (NMvsPass[i].p > dG_dimerNMinusVsPlus) {
            NMvsPass[i].p = dG_dimerNMinusVsPlus;
          }
          if (NMvsPass[i].m > dG_dimerNMinusVsMinus) {
            NMvsPass[i].m = dG_dimerNMinusVsMinus;
          }

          //for gating
          if (lowest_dG_HeteroNPlusVsPlus > dG_dimerNPlusVsPlus) {
            lowest_dG_HeteroNPlusVsPlus = dG_dimerNPlusVsPlus;
          }
          if (lowest_dG_HeteroNPlusVsMinus > dG_dimerNPlusVsMinus) {
            lowest_dG_HeteroNPlusVsMinus = dG_dimerNPlusVsMinus;
          }
          if (lowest_dG_HeteroNMinusVsPlus > dG_dimerNMinusVsPlus) {
            lowest_dG_HeteroNMinusVsPlus = dG_dimerNMinusVsPlus;
          }
          if (lowest_dG_HeteroNMinusVsMinus > dG_dimerNMinusVsMinus) {
            lowest_dG_HeteroNMinusVsMinus = dG_dimerNMinusVsMinus;
          }
        }
      }
      if (threshold > lowest_dG_HeteroNPlusVsPlus || threshold > lowest_dG_HeteroNPlusVsMinus || threshold > lowest_dG_HeteroNMinusVsPlus || threshold > lowest_dG_HeteroNMinusVsMinus) {
        return false;
      }
    }
    Gate_dG_passed++;
  }
  //Hetero-dimer check/ end===================================

  //dimer with selected=======================================
  var lowest_dG_HeteroNPlusVsSelected = 0;
  var lowest_dG_HeteroNMinusVsSelected = 0;

  var dG_dimerNPlusVsSelected = 0;
  var dG_dimerNMinusVsSelected = 0;
  var stepLength = 0;

  var NPvsSelected = [];
  var NMvsSelected = [];

  var localSelThreshold = threshold_selected;
  var progress1 = " "
  var progress2 = " "


  if (selected.length > 0) {
    //bulge new vs selected
    for (var i = 0, len = selected.length; i < len; i++) {
      NPvsSelected[i] = 0;
      NMvsSelected[i] = 0;

      for (var k = 0, len2 = B_newPlus.length; k < len2; k++) {
        if (B_newPlus[k].length >= selected[i].seq.length) {
          stepLength = B_newPlus[k].length;
        } else {
          stepLength = selected[i].seq.length;
        }

        for (var j = StepOffset; j < stepLength - StepOffset; j++) {
          // The step is based on the longer sequence

          dG_dimerNPlusVsSelected = cal_dG(B_newPlus[k].slicer(selected[i].seq, j), selected[i].seq.slicer(B_newPlus[k], j));
          dG_dimerNMinusVsSelected = cal_dG(B_newMinus[k].slicer(selected[i].seq, j), selected[i].seq.slicer(B_newMinus[k], j));

          //heatmap data refresh
          if (NPvsSelected[i] > dG_dimerNPlusVsSelected) {
            NPvsSelected[i] = dG_dimerNPlusVsSelected;
          }
          if (NMvsSelected[i] > dG_dimerNMinusVsSelected) {
            NMvsSelected[i] = dG_dimerNMinusVsSelected;
          }

          if (lowest_dG_HeteroNPlusVsSelected > dG_dimerNPlusVsSelected) {
            lowest_dG_HeteroNPlusVsSelected = dG_dimerNPlusVsSelected;
            // index_selectedToNP = i;
          }
          if (lowest_dG_HeteroNMinusVsSelected > dG_dimerNMinusVsSelected) {
            lowest_dG_HeteroNMinusVsSelected = dG_dimerNMinusVsSelected;
            // index_selectedToNM = i;
          }
        }
      }
      // If the selected sequence is shorter than the new sequence, apply a ratio to lower the threshold 
      if (selected[i].seq.length < NewPlusStrand.length){
        localSelThreshold = (threshold_selected * selected[i].seq.length / NewPlusStrand.length)
      }else{
        localSelThreshold = threshold_selected
      }
      if (localSelThreshold > lowest_dG_HeteroNPlusVsSelected || localSelThreshold > lowest_dG_HeteroNMinusVsSelected) {
        console.log("|" + localSelThreshold.toFixed(2) + "|" + lowest_dG_HeteroNPlusVsSelected.toFixed(2) + "|" + lowest_dG_HeteroNMinusVsSelected.toFixed(2) + "|" + progress1)
        return false;
      }
      progress1 = progress1 + `[${i}]>`
    }

    //bulge selected vs new
    var B_selected = [];
    for (var i = 0, len = selected.length; i < len; i++) {
      B_selected[i] = burlgeMaker(selected[i].seq, globalBurlge);
      for (var k = 0, len2 = B_selected[i].length; k < len2; k++) {
        if (NewPlusStrand.length >= B_selected[i][k].length) {
          stepLength = NewPlusStrand.length;
        } else {
          stepLength = B_selected[i][k].length;
        }

        for (var j = StepOffset; j < stepLength - StepOffset; j++) {
          dG_dimerNPlusVsSelected = cal_dG(NewPlusStrand.slicer(B_selected[i][k], j), B_selected[i][k].slicer(NewPlusStrand, j));
          dG_dimerNMinusVsSelected = cal_dG(NewMinusStrand.slicer(B_selected[i][k], j), B_selected[i][k].slicer(NewMinusStrand, j));

          //heatmap data refresh
          if (NPvsSelected[i] > dG_dimerNPlusVsSelected) {
            NPvsSelected[i] = dG_dimerNPlusVsSelected;
          }
          if (NMvsSelected[i] > dG_dimerNMinusVsSelected) {
            NMvsSelected[i] = dG_dimerNMinusVsSelected;
          }

          if (lowest_dG_HeteroNPlusVsSelected > dG_dimerNPlusVsSelected) {
            lowest_dG_HeteroNPlusVsSelected = dG_dimerNPlusVsSelected;
            // index_selectedToNP = i;
          }
          if (lowest_dG_HeteroNMinusVsSelected > dG_dimerNMinusVsSelected) {
            lowest_dG_HeteroNMinusVsSelected = dG_dimerNMinusVsSelected;
            // index_selectedToNM = i;
          }
        }
      }
      // If the selected sequence is shorter than the new sequence, apply a ratio to lower the threshold 
      if (selected[i].seq.length < NewPlusStrand.length){
        localSelThreshold = (threshold_selected * selected[i].seq.length / NewPlusStrand.length)
      }else{
        localSelThreshold = threshold_selected
      }
      if (localSelThreshold > lowest_dG_HeteroNPlusVsSelected || localSelThreshold > lowest_dG_HeteroNMinusVsSelected) {
        console.log("|" + localSelThreshold.toFixed(2) + "|" + lowest_dG_HeteroNPlusVsSelected.toFixed(2) + "|" + lowest_dG_HeteroNMinusVsSelected.toFixed(2) + "|" + progress2)
        return false;
      }
      progress2 = progress2 + `[${i}]>`
    }
    Gate_dG_selected++;
    //dimer with selected=======================================end
  }

  return {
    NPvsSelf: NPvsSelf,
    NMvsSelf: NMvsSelf,
    NPvsPass: NPvsPass,
    NMvsPass: NMvsPass,
    NPvsSelected: NPvsSelected,
    NMvsSelected: NMvsSelected,
  };
}
