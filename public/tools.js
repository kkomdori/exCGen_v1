/**--------------------------------------------------------
 * @software  exCGen 
 * @author    E.K.Jang
 * @contact   kkomdori@gmail.com
 * @copyright 2023. E.K.Jang. All rights reserved.
 * ------------------------------------------------------*/

const inputText = $("#inputText");
const inputCount = $("#inputCount");
const outputText = document.getElementById("outputText");
const outputCount = $("#outputCount");

const target = $("#target");
const as = $("#as");

const character = $("#character");
const start = $("#start");
const gap = $("#gap");

const checkbox = document.getElementById("compare");
var result_save = "";
const MutArr = ["A", "T", "G", "C"];

// When there is movement, execute the function
// document.addEventListener("mousemove", operate);
// document.addEventListener("keypress", operate);
// document.addEventListener("DOMContentLoaded", operate);
inputText.on("propertychange change keyup paste input", function () {
  operate("typing");
});

function operate(mode = "") {
  var inTxt = inputText.val();
  let countStrIn = `Words: ${words_count(inTxt)} | Char.: ${byteCounter(
    inTxt,
    0
  )} | Char. (+ space): ${byteCounter(inTxt, 1)}`;
  inputCount.text(countStrIn);
  var show_notification = "ON"

  switch (mode) {
    case "replace":
      var inTxt_filtered = replaceAll(inTxt, target.val(), as.val());
      result_save = inTxt_filtered;
      break;
    case "insert":
      var inTxt_filtered = insertChar(
        inTxt,
        character.val(),
        start.val(),
        gap.val()
      );
      result_save = inTxt_filtered;
      break;
    case "extract":
      var inTxt_filtered = extract(inTxt);
      result_save = inTxt_filtered;
      break;
    case "remF":
      var inTxt_filtered = inTxt.replace(/[0-9]/g, "");
      result_save = inTxt_filtered;
      break;
    case "remS":
      var inTxt_filtered = inTxt.replace(/\s/g, "");
      result_save = inTxt_filtered;
      break;
    case "remL":
      var inTxt_filtered = inTxt.replace(/\n/g, "");
      result_save = inTxt_filtered;
      break;
    case "shufW":
      var inTxt_filtered = shuffle_words(inTxt);
      result_save = inTxt_filtered;
      break;
    case "shufC":
      var inTxt_filtered = shuffle_char(inTxt);
      result_save = inTxt_filtered;
      break;
    case "StL":
      var inTxt_filtered = replaceAll(inTxt, " ", "\n");
      result_save = inTxt_filtered;
      break;
    case "LtS":
      var inTxt_filtered = replaceAll(inTxt, "\n", " ");
      result_save = inTxt_filtered;
      break;
    case "upper":
      var inTxt_filtered = caseChange("inputText", "upper");
      result_save = inTxt_filtered;
      break;
    case "lower":
      var inTxt_filtered = caseChange("inputText", "lower");
      result_save = inTxt_filtered;
      break;
    case "oddW":
      var inTxt_filtered = extract_stepping(inTxt, "odd");
      result_save = inTxt_filtered;
      break;
    case "evenW":
      var inTxt_filtered = extract_stepping(inTxt, "even");
      result_save = inTxt_filtered;
      break;
    case "rev":
      var inTxt_filtered = reverseString(inTxt);
      result_save = inTxt_filtered;
      break;
    case "com":
      var inTxt_filtered = complement(inTxt);
      result_save = inTxt_filtered;
      break;
    case "revcom":
      var inTxt_filtered = complement(reverseString(inTxt));
      result_save = inTxt_filtered;
      break; 
    case "pass":
      var inTxt_filtered = result_save;
      show_notification = "OFF"
      break;
    case "typing":
      var inTxt_filtered = inTxt;
      result_save = inTxt_filtered;
      show_notification = "OFF"
      break;
    case "":
      return;
  }

  // Count characters
  var outTxt = inTxt_filtered;
  let countStrOut = `Words: ${words_count(outTxt)} | Char.: ${byteCounter(
    outTxt, 0)} | Char. (+ space): ${byteCounter(outTxt, 1)}`;
  outputCount.text(countStrOut);

  // Output to div, implement comparison function
  outputText.innerHTML = "";
  const isCompareOn = checkbox.checked;
  if (isCompareOn == true) {
    inTxt_filtered = replaceAll(inTxt_filtered, " ", "^");// Represent space as a gap
    inTxt_filtered = replaceAll(inTxt_filtered, "\n", "/n");// Represent space as a gap
    var highlighted = dnaAlignment(inTxt, inTxt_filtered);
    outputText.innerHTML = highlighted;
  } else {
    inTxt_filtered = replaceAll(inTxt_filtered, "\n", "<br/>");
    outputText.innerHTML = inTxt_filtered;
  }

  if (show_notification == "ON"){showNotification('notification1')}
}

function words_count(text) {
  var wordCount = 0;
  let arr = text.trim().split(/\s+/); // Use split() to divide by spaces and create an array.

  // Check if every element of the array is a word
  for (let i = 0; i < arr.length; i++) {
    if (isWord(arr[i])) {
      wordCount++;
    }
  }
  return wordCount;
}

function isWord(str) {
  let alphaNumericFound = false;

  // If at least one alphabet or number is found in a word, it will be recognized as a word.
  for (let i = 0; i < str.length; i++) {
    // Writing them consecutively is interpreted as "is a number, or an alphabet, or Korean"
    // .test() checks if the argument in parentheses satisfies the regular expression and returns true or false.
    if (/[0-9a-zA-Zㄱ-ㅎㅏ-ㅣ가-힣]/.test(str[i])) {
      alphaNumericFound = true;
      return alphaNumericFound;
    }
  }
  return alphaNumericFound;
}

// With spaces: Korean, Chinese characters, Chinese, and Japanese are treated as 2 characters, while other languages, special characters, and spaces are treated as 1 character.
// Without spaces: Excludes spaces and line breaks.
function byteCounter(text, blank = 0) {
  // blank === 0 -> without spaces, blank !== 0 -> with spaces
  let byte = 0;
  // Set byte to 0, and for each character, add 2 if it's Korean/Chinese/Japanese, otherwise add 1.
  if (blank == 0) {
    // When not including spaces, replace line breaks and spaces with empty strings beforehand.
    text = text.replace(/\s+/g, "");
  }

  for (let i = 0; i < text.length; i++) {
    // If it's a Korean, Chinese, or Japanese language character, add 2 to byte, otherwise add 1, and finally return byte.
    if (/[ㄱ-ㅎㅏ-ㅣ가-힣一-龥ぁ-ゔァ-ヴー々〆〤]/.test(text[i])) {
      byte = byte + 2;
    } else {
      byte++;
    }
  }
  return byte;
}

function replaceAll(str, targetStr, replace) {
  return str.split(targetStr).join(replace);
}

function insertChar(str, char, init = 0, term = 5) {
  var plusChar = ""; //term 단위로 끊어서 char 추가
  // plusChar += str.substr(0, init) + char;

  if (term == 0) {
    plusChar += str.substr(0, init) + char;
    plusChar += str.substr(init, str.length - init);
  } else if (term > 0) {
    plusChar += str.substr(0, init) + char;
    for (let i = 0; i * term + parseInt(init) < str.length; i++) {
      // 그냥 '+ 숫자'는 문자열 더하기로 인식
      if (str.substr(i * term + parseInt(init), term).length == term) {
        plusChar += str.substr(i * term + parseInt(init), term) + char;
      } else {
        plusChar += str.substr(i * term + parseInt(init), term);
      }
    }
  } else {
    return;
  }

  return plusChar;
}

function clearAndRefresh(id) {
  document.getElementById(id).value = "";
  operate();
}

function sendToInput(textareaID, str = result_save, callback, callbackParam) {
  var textarea = document.getElementById(textareaID);
  textarea.value = str;
  callback(callbackParam);
}

function copyToClipboard(divID, callback, callbackParam) {
  var content = document.getElementById(divID);

  try {
    navigator.clipboard
      .writeText(content.innerText)
      .then(() => {
        console.log("Text copied to clipboard.");
      })
      .catch((err) => {
        console.log("Something went wrong", err);
      });

    callback(callbackParam);
  } catch {

    var range = document.createRange();
    range.selectNode(content);
    window.getSelection().removeAllRanges(); // clear current selection
    window.getSelection().addRange(range); // to select text
    document.execCommand("copy")
    window.getSelection().removeAllRanges();// to deselect

    callback(callbackParam);
  }
}

function showNotification(id){
  const notification = document.getElementById(id)
  notification.classList.add('show')
  setTimeout(() => {
    notification.classList.remove('show')
  }, 500)
}

function caseChange(id_from, mode) {
  var textarea_from = document.getElementById(id_from);
  if (mode == "upper") {
    return textarea_from.value.toUpperCase();
  } else if (mode == "lower") {
    return textarea_from.value.toLowerCase();
  } else {
    console.log("parameter error");
    return;
  }
}

// word extract slider$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
const inputLeft = document.getElementById("input-left");
const inputRight = document.getElementById("input-right");
const output_GC = document.getElementById("val_GCrange");

const thumbLeft = document.querySelector(".multi_slider > .thumb.left");
const thumbRight = document.querySelector(".multi_slider > .thumb.right");
const range = document.querySelector(".multi_slider > .range");

const setLeftValue = () => {
  const _this = inputLeft;
  const [min, max] = [parseInt(_this.min), parseInt(_this.max)];

  // 교차되지 않게, 1을 빼준 건 완전히 겹치기보다는 어느 정도 간격을 남겨두기 위해.
  _this.value = Math.min(parseInt(_this.value), parseInt(inputRight.value) - 1);

  // input, thumb 같이 움직이도록
  const percent = ((_this.value - min) / (max - min)) * 101;
  thumbLeft.style.left = percent + "%";
  range.style.left = percent + "%";

  if (inputRight.value == 101){
    output_GC.innerHTML = `${inputLeft.value} | over`;
  }else{
    output_GC.innerHTML = `${inputLeft.value} | ${inputRight.value}`;
  }
  gc_min = parseInt(inputLeft.value);
};

const setRightValue = () => {
  const _this = inputRight;
  const [min, max] = [parseInt(_this.min), parseInt(_this.max)];

  // 교차되지 않게, 1을 더해준 건 완전히 겹치기보다는 어느 정도 간격을 남겨두기 위해.
  _this.value = Math.max(parseInt(_this.value), parseInt(inputLeft.value) + 1);

  // input, thumb 같이 움직이도록
  const percent = ((_this.value - min) / (max - min)) * 101;
  thumbRight.style.right = 101 - percent + "%";
  range.style.right = 101 - percent + "%";

  if (inputRight.value == 101){
    output_GC.innerHTML = `${inputLeft.value} | over`;
  }else{
    output_GC.innerHTML = `${inputLeft.value} | ${inputRight.value}`;
  }
};

inputLeft.addEventListener("input", setLeftValue);
inputRight.addEventListener("input", setRightValue);
output_GC.innerHTML = `${inputLeft.value} | ${inputRight.value}`;

// word extract slider$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$end

function extract(str, lenMin = inputLeft.value, lenMax = inputRight.value) {
  var newStr = "";
  let arr = str.trim().split(/\s+/);

  if (lenMax == 101) {
    for (let i = 0; i < arr.length; i++) {
      if (isWord(arr[i])) {
        if (arr[i].length >= lenMin) {
          if (newStr == "") {
            newStr += arr[i];
          } else {
            newStr += " " + arr[i];
          }
        }
      }
    }
  } else {
    for (let i = 0; i < arr.length; i++) {
      if (isWord(arr[i])) {
        if (arr[i].length >= lenMin && arr[i].length <= lenMax) {
          if (newStr == "") {
            newStr += arr[i];
          } else {
            newStr += " " + arr[i];
          }
        }
      }
    }
  }
  return newStr;
}

function extract_stepping(str, mode) {
  var newStr = "";
  let arr = str.trim().split(/\s+/);

  if (mode == "odd") {
    for (let i = 0; 2 * i < arr.length; i++) {
      if (isWord(arr[2 * i])) {
        if (newStr == "") {
          newStr += arr[2 * i];
        } else {
          newStr += " " + arr[2 * i];
        }
      }
    }
  } else if (mode == "even") {
    for (let i = 1; 2 * i - 1 < arr.length; i++) {
      if (isWord(arr[2 * i - 1])) {
        if (newStr == "") {
          newStr += arr[2 * i - 1];
        } else {
          newStr += " " + arr[2 * i - 1];
        }
      }
    }
  } else {
    return;
  }
  return newStr;
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

function shuffle_words(str){
  let words = str.trim().split(/\s+/);
  let mixedWords = [];
  while (words.length > 0) {
    let randomIndex = Math.floor(Math.random() * words.length);
    mixedWords.push(words[randomIndex])
    words.splice(randomIndex, 1);
  }
  let mixedStr = mixedWords.join(" ");
  return mixedStr;
}

function shuffle_char(str){
  let words = str.trim().split(/\s+/);
  let mixedWords = [];
  for (let i = 0; i < words.length; i++) {
    let word = words[i];
    let mixedWord = "";
    while (word.length > 0) {
      let randomIndex = Math.floor(Math.random() * word.length);
      mixedWord += word[randomIndex];
      word = word.slice(0, randomIndex) + word.slice(randomIndex + 1);
    }
    mixedWords.push(mixedWord); // add the mixed word to the mixedWords array
  }
  let mixedStr = mixedWords.join(" ");
  return mixedStr;
}

function dnaAlignment(id_seq1, id_seq2) {
  const seq1 = id_seq1;
  const seq2 = id_seq2;

  const gapPenalty = -1; // Penalty for gap insertion or deletion
  const mismatchPenalty = -1; // Penalty for mismatch
  const matchScore = 2; // Score for match

  // Create a 2D matrix to store the alignment scores
  const matrix = new Array(seq1.length + 1);
  for (let i = 0; i <= seq1.length; i++) {
    matrix[i] = new Array(seq2.length + 1).fill(0);
  }

  // Initialize the first row and first column of the matrix with gap penalties
  for (let i = 0; i <= seq1.length; i++) {
    matrix[i][0] = i * gapPenalty;
  }
  for (let j = 0; j <= seq2.length; j++) {
    matrix[0][j] = j * gapPenalty;
  }

  // Fill in the rest of the matrix
  for (let i = 1; i <= seq1.length; i++) {
    for (let j = 1; j <= seq2.length; j++) {
      const match =
        matrix[i - 1][j - 1] +
        (seq1[i - 1] === seq2[j - 1] ? matchScore : mismatchPenalty);
      const deleteGap = matrix[i - 1][j] + gapPenalty;
      const insertGap = matrix[i][j - 1] + gapPenalty;
      matrix[i][j] = Math.max(match, deleteGap, insertGap);
    }
  }

  // Traceback to get the aligned sequences
  let alignedSeq1 = "";
  let alignedSeq2 = "";
  let i = seq1.length;
  let j = seq2.length;
  while (i > 0 || j > 0) {
    if (
      i > 0 &&
      j > 0 &&
      matrix[i][j] ===
        matrix[i - 1][j - 1] +
          (seq1[i - 1] === seq2[j - 1] ? matchScore : mismatchPenalty)
    ) {
      alignedSeq1 = seq1[i - 1] + alignedSeq1;
      alignedSeq2 = seq2[j - 1] + alignedSeq2;
      i--;
      j--;
    } else if (i > 0 && matrix[i][j] === matrix[i - 1][j] + gapPenalty) {
      alignedSeq1 = seq1[i - 1] + alignedSeq1;
      alignedSeq2 = "-" + alignedSeq2;
      i--;
    } else {
      alignedSeq1 = "-" + alignedSeq1;
      alignedSeq2 = seq2[j - 1] + alignedSeq2;
      j--;
    }
  }

  // Display the aligned sequences with mismatches and gaps highlighted
  let alignedSeq1Highlighted = "";
  let alignedSeq2Highlighted = "";
  for (let k = 0; k < alignedSeq1.length; k++) {
    if (alignedSeq1[k] === alignedSeq2[k]) {
      alignedSeq1Highlighted += alignedSeq1[k];
      alignedSeq2Highlighted += alignedSeq2[k];
    } else if (alignedSeq1[k] === "-") {
      alignedSeq1Highlighted += "<span style='color: red'>-</span>";
      alignedSeq2Highlighted += "<span style='color: red'>" + alignedSeq2[k] + "</span>";
    } else if (alignedSeq2[k] === "-") {
      alignedSeq1Highlighted += "<span style='color: red'>" + alignedSeq1[k] + "</span>";
      alignedSeq2Highlighted += "<span style='color: red'>-</span>";
    } else {
      alignedSeq1Highlighted +=
        "<span style='color: red'>" + alignedSeq1[k] + "</span>";
      alignedSeq2Highlighted +=
        "<span style='color: red'>" + alignedSeq2[k] + "</span>";
    }
  }

  return alignedSeq2Highlighted;
}
