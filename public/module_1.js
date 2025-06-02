/**--------------------------------------------------------
 * @software  exCGen 
 * @author    E.K.Jang
 * @contact   kkomdori@gmail.com
 * @copyright 2023. E.K.Jang. All rights reserved.
 * ------------------------------------------------------*/
var copyright = "Copyright 2023. E.K.Jang. All rights reserved.";
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
const StepOffset = 2; //burlge 서열 제작으로 인한 길이 편차를 감안한 말단부 비교스텝 축소치

var toggle = "on";
var targetObj = []; //랜덤생산 서열 저장
var targetGC = []; //gc_distributor(num_pairs, gc_min, gc_max);

var dG_Obj = []; //gate 통과값 저장
var passObj = []; //최종 서열 정보 저장

var count = 0;
var failed = 0;
var completion = 0;
var Gate_dG_hairpin = 0;
var Gate_dG_self = 0;
var Gate_dG_selected = 0;
var Gate_dG_passed = 0;

function main() {
  //느린속도, but 제어가능; main(){setTimeout(){반복문; setTimesout(){main}}}
  draw(); //상황창에 반영

  setTimeout(() => {
    if (completion < num_pairs && toggle == "on") {
      // console.log("queue");
      count++;

      targetObj = sequenceMaker(preset_seq, targetGC[completion]); //서열 생산
      Object.assign(targetObj, { duplex: cal_dG(targetObj.plus, targetObj.minus).toFixed(2) });
      //{ plus: pStrand_str, minus: complement(pStrand.reverse().join("")), gcr: pStrand_GC };

      //설정값에서 Duplex의 dG를 나누어 각 dG 한계치 받기
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
        Object.assign(targetObj, dG_Obj); //targetObj 에 dG_Obj 의 속성값 추가
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
  // for (var i = 0; i < completion; i++) {
  //   console.log(`Completion [${i}]: ` + JSON.stringify(resultObj[i]));
  // }
  if (completion == num_pairs) {
    var now = new Date();
    document.getElementById("end").innerHTML = now.toLocaleString(); //종료시간 저장
    inputActivaton(false);
  }

  drawTable(resultObj, selectedObj)
  heatmapForHairpin(num_pairs, completion, resultObj, thresholdOfHair_dGper);
  heatmapForCrossPairs(num_pairs, completion, resultObj, thresholdOfCross_dGper);
  heatmapForSelected(num_pairs, completion, resultObj, selectedObj, thresholdOfSelected_dGper);
}

function gc_distributor(pairs_amount, minGC, maxGC) {
  //fragment 개수만큼 오름차순으로 분류한 gc % 값을 포함한 배열 반환
  var gcD = [];
  var gcGap;

  gcGap = (maxGC - minGC) / (pairs_amount - 1);

  for (var i = 0; i < pairs_amount; i++) {
    gcD[i] = minGC + gcGap * i;
  }
  return gcD;
}

function sequenceMaker(preset_str, GC_ratio = 50, tolerance = 2.5) {
  //제시된 GC ratio와 일치하는 서열 제작. tolerance는 오차값 허용 여부.

  var pStrand = [];
  var arr = [];

  const arrATGC = ["A", "T", "G", "C"];
  const arrATATGC = ["A", "T", "A", "T", "A", "T", "G", "C", "G", "C"];
  const arrATGCGC = ["A", "T", "A", "T", "G", "C", "G", "C", "G", "C"];
  const arrR = ["A", "G"];
  const arrY = ["T", "C"];
  const arrS = ["G", "C"];
  const arrW = ["A", "T"];

  //GC contents에 맞춰 basepool 적용
  if (GC_ratio <= 45) {
    arr = arrATATGC;
  } else if (GC_ratio > 55) {
    arr = arrATGCGC;
  } else {
    arr = arrATGC;
  }

  //preset 반영
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

    //GC 검수 후 통과 서열의 minus 서열 정보를 더하여 return
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

// 특정 문자 수를 세주는 함수
// String.prototype.countChar = function (char) {
//   var count = 0;
//   var searchChar = char; // 찾으려는 문자
//   var pos = 0;
//   var pos = this.indexOf(searchChar);
//   while (pos !== -1) {
//     count++;
//     pos = this.indexOf(searchChar, pos + 1);
//   }
//   return count;
// };

function complement(str) {
  str = str.replace(/A/gi, "1");
  str = str.replace(/T/gi, "A");
  str = str.replace(/1/gi, "T");
  str = str.replace(/C/gi, "1");
  str = str.replace(/G/gi, "C");
  str = str.replace(/1/gi, "G");
  // str.replace(/찾을 문자열/gi, "변경할 문자열")
  // g : 전체 모든 문자열을 변경 global
  // i : 영문 대소문자를 무시, 모두 일치하는 패턴 검색 ignore

  return str;
}

function reverseString(str) {
  var reversedStr = str.split("").reverse().join(""); 
  return reversedStr; 
}


function Gate_Ex(plusStrand, minusStrand, exceptObj) {
  //순환문을 이용해 plusStrand와 minusStrand가 각 제외서열과 일치하는 부분이 있는지 조사
  //일치하는 서열이 발견되면 False 반환 후 function 종료, 모든 exceptional 서열과 일치하는 부분이 없으면 True 반환.

  //입력된 제외서열이 없으면 True 반환 후 Function 종료
  if (exceptObj.join("").trim() == "") {
    return true;
  }
  for (var i = 0, len = exceptObj.length; i < len; i++) {
    if (exceptObj[i].seq == "") {
      //빈 칸일때
      continue;
    } else if (plusStrand.includes(exceptObj[i].seq) == true || minusStrand.includes(exceptObj[i].seq) == true) {
      return false; //탈락
    }
  }
  return true;
}

function hairpinMaker(inputSeq, hairpinLength = 4, startPos = 3, slice = "on") {
  //헤어핀 형성으로 나뉘는 좌우 가닥을 객체배열로 반환함
  //slice 옵션으로 제단된 서열 반환

  var hairpinSeq = []; //{left: leftPart, right: rightPart}
  for (var h = 3; h <= hairpinLength; h++) {
    //hairpin loop 3mer 부터 적용
    for (var i = 0, len = inputSeq.length; i <= len - (h + 2 * startPos); i++) {
      if (slice == "on") {
        //loop 좌,후 서열을 같은 길이로 재단해서 반환
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
  //입력된 서열에서 burlge 길이만큼 자르고 앞뒤 이어붙임
  //10mer inputSeq, burlgeLength=1, startPos=3 일 때,
  //burlgeSeq[1] = inputSeq[0~2] + inputSeq[4~9]; start
  //burlgeSeq[4] = inputSeq[0~5] + inputSeq[7~9]; end
  //burlge 3은 burlge 0,1,2의 결과를 포함함.

  var burlgeSeq = [];
  burlgeSeq[0] = inputSeq; //첫 서열은 no burlge

  for (var h = 1; h <= burlgeLength; h++) {
    for (var i = 0; i <= inputSeq.length - (h + 2 * startPos); i++) {
      //burlgeSeq[0]는 no burlge inputSeq
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
  //문자열에서 특정 index에 문자를 insert 하는 함수; replace 용으로 사용 가능
  //range=0, insertion; range=1, 기존문자 1개를 char로 replace.
  return this.substr(0, index) + char + this.substr(index + range);
};

String.prototype.slicer = function (parallelSeq, step = "off") {
  //sliding algorithm (Peter M. Vallone, BioTechniques, 2004)

  //특정 문자열에 대해 비교 문자열을 받아서 비교차수(step)에 맞춰 제단. 방향은 5'->3'
  //1. input 서열이 short인지 long인지 결정. 2.sliding 비교 알고리즘의 step에 따른 서열제단
  //2-1. step <= short 일 때; 2-2. short < step <= long 일 때; 2-3. long < step 일 때

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
        slicedSeq = this.substr(0, step); //기본 step 길이에 맞춰 자르기
      } else if (short < step && step <= long) {
        slicedSeq = this.substr(0, short);
        //비교 step이 short 길이를 넘은 경우 short 길이에 맞춰 자르기
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
  //동일 길이의 두 서열이 전달되면 알파벳 배열로 바꾸고 pairing을 하여 dG 값을 산출함

  //공백은 예외처리
  if (sliceNew == "" || sliceOld == "") {
    return 0;
  }

  var pairingLen = sliceNew.trim().length;

  //splicedSeq를 알파벳 배열로 전환
  var spNew = [];
  var spOld = [];
  var spOld_rev = []; //비교 서열을 3to5로 전환

  for (var i = 0; i < pairingLen; i++) {
    spNew[i] = sliceNew.substr(i, 1);
    spOld[i] = sliceOld.substr(i, 1);
    spOld_rev[pairingLen - (i + 1)] = spOld[i];
  }

  var pairing = []; //match, mismatch 결과 (pair) 저장할 배열
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

  //pairResult 첫 문자와 마지막 문자에 공백 추가, for adjusting nearest neighbor model
  pairResult = "_" + pairing.join("") + "_";

  var NN = "";
  var dG = 0;

  //pairResult 문자열로부터 왼쪽부터 2자씩 뒤의 1자가 중복되도록 읽어온다.
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

  //hairpin 생성. plus 가닥만 비교. minus 가닥과 결과 동일함.
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
    return false; //기준치보다 안정적으로 hairpin 형성하면 리젝.
  } else {
    // console.log("Gate_dG_hairpin: pass");
    Gate_dG_hairpin++;
    return lowest_dG_HairNPlus.toFixed(2);
  }
}

function Gate_dG_cross(NewPlusStrand, NewMinusStrand, threshold, threshold_selected, passedNum = 0) {
  //전역변수 사용내역
  // const globalBurlge;
  // const stepOffset;
  // var plusStrands = [] //passed sequence
  // var minusStrands = [] //passed sequence
  // var Gate_dG_self = 0;
  // var Gate_dG_selected = 0;
  // var Gate_dG_passed = 0;

  //Self-dimer check======================================
  var lowest_dG_SelfNPlus = 0;
  var lowest_dG_SelfNMinus = 0;

  var dG_dimerNPlusVsNPlus = 0;
  var dG_dimerNMinusVsNMinus = 0;

  var NPvsSelf = 0;
  var NMvsSelf = 0;

  //burlge 서열 생성
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
    //passedNum > 0 부터 검사 시작, 즉, 최초 라운드는 이전 생성 서열이 없으므로 검사 제외

    //burlge new vs complete
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

    //burlge complete vs new
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
    //burlge new vs selected
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
          //step은 긴 서열을 기준으로

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
      //selected 서열이 new 서열보다 짧을 경우 비율 적용해서 threshold 낮춤 
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

    //burlge selected vs new
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
      //selected 서열이 new 서열보다 짧을 경우 비율 적용해서 threshold 낮춤 
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

function info() {
  alert(copyright);
}
