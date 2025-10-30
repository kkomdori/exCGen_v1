/**--------------------------------------------------------
 * @software  exCGen 
 * @author    E.K.Jang
 * @contact   kkomdori@gmail.com
 * @copyright 2023. E.K.Jang. All rights reserved.
 * ------------------------------------------------------*/

var length = 20; //Length of sequences you want to generate
var num_pairs = 5; //Pairs of sequences
var preset_seq = "";
var gc_min = 40; //default GC contents range
var gc_max = 60; //default GC contents range

var thresholdOfHair_dGper = 10;
var thresholdOfCross_dGper = 25;
var thresholdOfSelected_dGper = 30;

var default_avodingSeq =
  ">A4\nAAAA\n>T4\nTTTT\n>G4\nGGGG\n>C4\nCCCC\n>AT_repeat1\nATATAT\n>AT_repeat2\nTATATA\n>GC_repeat1\nGCGCGC\n>GC_repeat2\nCGCGCG\n>G-quaduplex1\nAGGAGGAGG\n>G-quaduplex2\nTGGTGGTGG\n>BbvC1_P\nCCTCAGC\n>BbvC1_N\nGCTGAGG\n>Sal1\nGTCGAC";

var avoids = []; //avoids 오브젝트
var selected = []; //selections 오브젝트
var selectedStorage = "";

//tab 기능 관련$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
$(document).ready(function () {
  $("ul.tabs li").click(function () {
    var tab_id = $(this).attr("data-tab");

    $("ul.tabs li").removeClass("current");
    $(".tab-content").removeClass("current");

    $(this).addClass("current");
    $("#" + tab_id).addClass("current");
  });
});

//length slider$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
const slider_length = document.getElementById("length");
const output_length = document.getElementById("val_length");
output_length.innerHTML = slider_length.value;

const minLength = document.getElementById("min_length");
const maxLength = document.getElementById("max_length");
minLength.innerHTML = parseInt(slider_length.min);
maxLength.innerHTML = parseInt(slider_length.max);

//event on silider input
slider_length.oninput = function () {
  output_length.innerHTML = this.value;
  length = this.value;
};

//preset bases>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
presetSeq.addEventListener("focus", function (event) {
  event = event || window.event; //Internet Explorer의 경우 e가 없음. 대신에 window.event 사용.

  var preset_refin = presetRefine(presetSeq.value, length, 5, " ");
  preset_seq = preset_refin.result;
  presetSeq.value = preset_refin.shown;
});
presetSeq.addEventListener("blur", function (event) {
  event = event || window.event; //Internet Explorer의 경우 e가 없음. 대신에 window.event 사용.

  var preset_refin = presetRefine(presetSeq.value, length, 5, " ");
  preset_seq = preset_refin.result;
  presetSeq.value = preset_refin.shown;

  if (Gate_Ex(preset_seq, "", avoids) == false) {
    alert("Preset bases includes the avoding sequences.");
  }
});
//text-area#################################################################
const avodingSeq = document.getElementById("avodingSeq");
avodingSeq.innerHTML = default_avodingSeq;
avoids = fastaToObj(default_avodingSeq);

avodingSeq.oninput = function () {
  avoids = fastaToObj(this.value);
};

const selectedSeq = document.getElementById("selectedSeq");
document.getElementById("three").addEventListener("click", function(){
   selectedSeq.innerHTML = selectedStorage;
})
selectedSeq.oninput = function () {
  selected = fastaToObj(this.value);
  selectedStorage = this.value
  drawTable("", selected);
};

//Pairs slider$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
const slider_pairs = document.getElementById("pairs");
const output_pairs = document.getElementById("val_pairs");
output_pairs.innerHTML = slider_pairs.value;

const minPairs = document.getElementById("min_pairs");
const maxPairs = document.getElementById("max_pairs");
minPairs.innerHTML = parseInt(slider_pairs.min);
maxPairs.innerHTML = parseInt(slider_pairs.max);

slider_pairs.oninput = function () {
  output_pairs.innerHTML = this.value;
  num_pairs = this.value;
};

//GC contants slider$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
const inputLeft = document.getElementById("input-left");
const inputRight = document.getElementById("input-right");
const output_GC = document.getElementById("val_GCrange");

const thumbLeft = document.querySelector(".multi_slider > .thumb.left");
const thumbRight = document.querySelector(".multi_slider > .thumb.right");
const range = document.querySelector(".multi_slider > .range");

const setLeftValue = () => {
  const _this = inputLeft;
  const [min, max] = [parseInt(_this.min), parseInt(_this.max)];

  // To prevent the handles from crossing, subtract 1 to leave some space rather than letting them overlap completely.
  _this.value = Math.min(parseInt(_this.value), parseInt(inputRight.value) - 1);

  // To move input and thumb at the same time
  const percent = ((_this.value - min) / (max - min)) * 100;
  thumbLeft.style.left = percent + "%";
  range.style.left = percent + "%";

  output_GC.innerHTML = `${inputLeft.value} | ${inputRight.value}`; //설정값 표시
  gc_min = parseInt(inputLeft.value);
};

const setRightValue = () => {
  const _this = inputRight;
  const [min, max] = [parseInt(_this.min), parseInt(_this.max)];

  _this.value = Math.max(parseInt(_this.value), parseInt(inputLeft.value) + 1);

  const percent = ((_this.value - min) / (max - min)) * 100;
  thumbRight.style.right = 100 - percent + "%";
  range.style.right = 100 - percent + "%";

  output_GC.innerHTML = `${inputLeft.value} | ${inputRight.value}`; //설정값 표시
  gc_max = parseInt(inputRight.value);
};

inputLeft.addEventListener("input", setLeftValue);
inputRight.addEventListener("input", setRightValue);
output_GC.innerHTML = `${inputLeft.value} | ${inputRight.value}`;

//hairpin dG slider$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
const slider_hairpinG = document.getElementById("hairpinG");
const output_hairpinG = document.getElementById("val_hairpinG");
output_hairpinG.innerHTML = slider_hairpinG.value;

const minHairpinG = document.getElementById("min_hairpinG");
const maxHairpinG = document.getElementById("max_hairpinG");
minHairpinG.innerHTML = parseInt(slider_hairpinG.min);
maxHairpinG.innerHTML = parseInt(slider_hairpinG.max);

slider_hairpinG.oninput = function () {
  output_hairpinG.innerHTML = this.value;
  thresholdOfHair_dGper = this.value;
};
//cross dG slider$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
const slider_crossG = document.getElementById("crossG");
const output_crossG = document.getElementById("val_crossG");
output_crossG.innerHTML = slider_crossG.value;

const minCrossG = document.getElementById("min_crossG");
const maxCrossG = document.getElementById("max_crossG");
minCrossG.innerHTML = parseInt(slider_crossG.min);
maxCrossG.innerHTML = parseInt(slider_crossG.max);

slider_crossG.oninput = function () {
  output_crossG.innerHTML = this.value;
  thresholdOfCross_dGper = this.value;
};
//selected dG slider$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
const slider_selectedG = document.getElementById("selectedG");
const output_selectedG = document.getElementById("val_selectedG");
output_selectedG.innerHTML = slider_selectedG.value;

const minSelectedG = document.getElementById("min_selectedG");
const maxSelectedG = document.getElementById("max_selectedG");
minSelectedG.innerHTML = parseInt(slider_selectedG.min);
maxSelectedG.innerHTML = parseInt(slider_selectedG.max);

slider_selectedG.oninput = function () {
  output_selectedG.innerHTML = this.value;
  thresholdOfSelected_dGper = this.value;
};
//$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$

//실행
document.getElementById("run").addEventListener("click", function (event) {
  console.log("exCGen start");
  init();
  main();
  console.log("| threshold | lowest dG for PlusVsSelected | lowest dG for MinusVsSelected | Passed selected [No.]> ")
  inputActivaton(true);
});
//중지
document.getElementById("stop").addEventListener("click", function (event) {
  toggle = "off";
  inputActivaton(false);
});
//재시작
document.getElementById("continue").addEventListener("click", function (event) {
  toggle = "on";
  main();
  inputActivaton(true);
});


function init() {
  //초기조건 받기
  length = slider_length.value;
  num_pairs = slider_pairs.value;
  // console.log("num_pairs: " + num_pairs);
  thresholdOfHair_dGper = slider_hairpinG.value;
  thresholdOfCross_dGper = slider_crossG.value;
  thresholdOfSelected_dGper = slider_selectedG.value;

  avoids = fastaToObj(avodingSeq.value);
  selected = fastaToObj(selectedSeq.value);
  preset_seq = "";

  targetObj = []; //랜덤생산 서열 저장
  targetGC = gc_distributor(num_pairs, gc_min, gc_max);

  dG_Obj = []; //gate 통과값 저장
  passObj = []; //최종 서열 정보 저장

  toggle = "on";
  count = 0;
  failed = 0;
  completion = 0;
  Gate_dG_hairpin = 0;
  Gate_dG_self = 0;
  Gate_dG_selected = 0;
  Gate_dG_passed = 0;

  var preset_refin = presetRefine(presetSeq.value, length, 5, " ");
  preset_seq = preset_refin.result;
  presetSeq.value = preset_refin.shown;

  var now = new Date();
  document.getElementById("start").innerHTML = now.toLocaleString(); //시작시간 저장
  document.getElementById("end").innerHTML = ""; //종료시간 저장
}

function draw() {
  /*global var
  var count = 0; 
  var failed = 0;
  var completion = 0;
  var Gate_dG_self = 0;
  var Gate_dG_selected = 0;
  var Gate_dG_passed = 0;
  */

  document.getElementById("total").innerHTML = count;
  document.getElementById("pass_hairpin").innerHTML = Gate_dG_hairpin;
  document.getElementById("pass_self-dimer").innerHTML = Gate_dG_self;
  document.getElementById("pass_selected").innerHTML = Gate_dG_selected;
  document.getElementById("pass_passed").innerHTML = Gate_dG_passed;
  document.getElementById("completion").innerHTML = completion;
}

function openResult(id){
  $(id).css("display","block");
}
function closeResult(id){
  $(id).css("display","none");
}

// A	Adenine
// C	Cytosine
// G	Guanine
// T	Thymine
// R	Guanine / Adenine (purine)
// Y	Cytosine / Thymine (pyrimidine)
// S	Guanine / Cytosine
// W	Adenine / Thymine
// *	Adenine / Guanine / Cytosine / Thymine

function presetRefine(string, len, term, char) {
  //ATGCRYSW* 을 제외한 문자 제거, 공백 제거, term마다 char 도입, 대문자화
  var preset = "";
  if (string == "") {
    for (var i = 0; i < len; i++) {
      preset += "*"; //textform에 입력 안했으면
    }
    console.log("preset is empty");
  } else {
    preset = string.toUpperCase();
    preset = preset.replace(/[^ATGCRYSW*]/g, ""); //비허용 문자 제거
    preset = preset.replace(/\s/g, ""); //공백 제거
    if (preset.length < len) {
      for (var i = preset.length; i < len; i++) {
        preset += "*"; //원래 길이보다 짧으면 별 추가
      }
    } else if (preset.length > len) {
      preset = preset.substr(0, len); //원래 길이보다 길면 긴부분 삭제
    }
  }
  var preset_shown = ""; //term 단위로 끊어서 char 추가
  for (let i = 0; i * term < preset.length; i++) {
    if (preset.substr(i * term, term).length == 5) {
      preset_shown += preset.substr(i * term, term) + char;
    } else {
      preset_shown += preset.substr(i * term, term);
    }
  }
  console.log("preset is: " + preset);
  return { result: preset, shown: preset_shown };
}

function drawTable(completeObj, selectedObj){
  
  if(completeObj.length == 0){//completeObj에 대한 입력값이 없으면 select 목록만 갱신
    $("#table2>tr").remove()//기존에 그려진 표태그 지우기 
    $("#table4>tr").remove()//기존에 그려진 표태그 지우기 
    var table2 = document.getElementById("table2");
    var table4 = document.getElementById("table4");

    for (var i = 0; i < selectedObj.length; i++) {
      var row = `<tr>
                  <td>${selectedObj[i].id}</td>
                  <td>${selectedObj[i].seq}</td>
                  <td>${selectedObj[i].seq.length}</td>
                  <td>${selectedObj[i].gcr}</td>
                  <td>${selectedObj[i].duplex}</td>
                  </tr>`;
      table2.innerHTML += row;
      table4.innerHTML += row;
    }
  }

  $("#table1>tr").remove()// Remove previous table tag 
  $("#table2>tr").remove()
  $("#table3>tr").remove() 
  $("#table4>tr").remove() 

  var table1 = document.getElementById("table1");
  var table2 = document.getElementById("table2");
  var table3 = document.getElementById("table3");
  var table4 = document.getElementById("table4");

  for (var i = 0; i < completeObj.length; i++) {
    var row = `<tr>
                <td>${i} +</td>
                <td>${completeObj[i].plus}</td>
                <td>${completeObj[i].plus.length}</td>
                <td>${completeObj[i].gcr.toFixed(1)}</td>
                <td>${completeObj[i].duplex}</td>
               </tr>
               <tr>
                <td>${i} -</td>
                <td>${completeObj[i].minus}</td>
                <td>${completeObj[i].minus.length}</td>
                <td>${completeObj[i].gcr.toFixed(1)}</td>
                <td>${completeObj[i].duplex}</td>
               </tr>`;
    table1.innerHTML += row;
    table3.innerHTML += row;
  }
  for (var i = 0; i < selectedObj.length; i++) {
    var row = `<tr>
                <td>${selectedObj[i].id}</td>
                <td>${selectedObj[i].seq}</td>
                <td>${selectedObj[i].seq.length}</td>
                <td>${selectedObj[i].gcr}</td>
                <td>${selectedObj[i].duplex}</td>
                </tr>`;
    table2.innerHTML += row;
    table4.innerHTML += row;
  }
}

// Return object after edit avoid and selected sequence
function fastaToObj(string) {
  /*global var
  thresholdOfCross_dGper 
  */

  if (string == ""){
    return (resultObj = []);
  }

  var idArr = [];
  var seqArr = [];
  var resultObj = [];

  // const regex = />.*?\n|([ATGCatgc\n]+)/gim; // Extracts the string between > and newline, and strings composed of ATGC characters.
  const regexA = />.*?\n/gim; // Extracts the string between > and the newline character.
  const regexB = /([ATGCatgc]+)/gim; // Extracts a continuous string composed of ATGCatgc characters.

  idArr = string.match(regexA);
  string = string.replace(regexA, "^@");
  string = string.replace(/\s/g, "");
  string = string.toUpperCase();
  seqArr = string.match(regexB);

  var len = idArr.length;

  var duplex = 0;

  //resultArr -> resultObj
  if (len == 0 || len == "") {
    return (resultObj = []);
  } else {
    for (var i = 0; i < len; i++) {
      var temp_sel = seqArr[i]
      var sel_GC = (temp_sel.replace(/[^GC]/gi, "").length * 100) / seqArr[i].length;
      duplex = cal_dG(seqArr[i], complement(reverseString(seqArr[i])))
      resultObj[i] = {id: idArr[i].slice(1,-1), seq: seqArr[i], gcr: sel_GC.toFixed(1), duplex: duplex.toFixed(2)} 
    }
    console.log (resultObj)
    return resultObj;
  }
}

function copyToClipboard(id) {
  var content = document.getElementById(id);

  try {
    navigator.clipboard
      .writeText(content.innerText)
      .then(() => {
        console.log("Text copied to clipboard...");

        showNotification()
      })
      .catch((err) => {
        console.log("Something went wrong", err);
      });
  } catch {
    var range = document.createRange();
    range.selectNode(content);
    window.getSelection().removeAllRanges(); // clear current selection
    window.getSelection().addRange(range); // to select text
    document.execCommand("copy")
    window.getSelection().removeAllRanges();// to deselect

    showNotification()
  }
}

const showNotification = () => {
  const notification = document.getElementById('notification')
  notification.classList.add('show')
  setTimeout(() => {
    notification.classList.remove('show')
  }, 700)
}

function inputActivaton(mode = false) {
  $("#length").attr("disabled", mode);
  $("#pairs").attr("disabled", mode);
  $("#input-left").attr("disabled", mode);
  $("#input-right").attr("disabled", mode);
  $("#hairpinG").attr("disabled", mode);
  $("#crossG").attr("disabled", mode);
  $("#presetSeq").attr("disabled", mode);
  $("#avodingSeq").attr("disabled", mode);
  $("#selectedSeq").attr("disabled", mode);
}