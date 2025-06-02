/*********************************************************************************
The MIT License (MIT)

Copyright (c) 2018 ApexCharts

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
***********************************************************************************/

function heatmapForSelected(pairs, complete, resultObj, selectedObj, threshold) {
  //heatmap data 초기화******************************
  var seriesArr = [];

  for (var i = 0; i < pairs; i++) {
    seriesArr[2 * i] = { name: i + "+", data: [] };
    seriesArr[2 * i + 1] = { name: i + "-", data: [] };

    for (var j = 0, len = selectedObj.length; j < len; j++) {
      seriesArr[2 * i].data.push({ x: selectedObj[j].id.slice(0, 8), y: "0" });
      seriesArr[2 * i + 1].data.push({ x: selectedObj[j].id.slice(0, 8), y: "0" });
    }
  }
  //heatmap data 초기화******************************end

  for (var i = 0; i < complete; i++) {
    for (var j = 0, len = selectedObj.length; j < len; j++) {
      var ratio_len = selectedObj[j].seq.length / resultObj[i].plus.length
      if (ratio_len<1){//selected 길이가 length보다 짧으면 감소된 duplex 비율 적용
        seriesArr[2 * i].data[j].y = (resultObj[i].cross.NPvsSelected[j] / (resultObj[i].duplex * ratio_len)).toFixed(2);
        seriesArr[2 * i + 1].data[j].y = (resultObj[i].cross.NMvsSelected[j] / (resultObj[i].duplex * ratio_len)).toFixed(2);
      }else{
        seriesArr[2 * i].data[j].y = (resultObj[i].cross.NPvsSelected[j] / resultObj[i].duplex).toFixed(2);
        seriesArr[2 * i + 1].data[j].y = (resultObj[i].cross.NMvsSelected[j] / resultObj[i].duplex).toFixed(2);
      }
    }
  }
  // console.log("selected " + JSON.stringify(seriesArr));

  var options = {
    series: seriesArr, // data 붙여넣기
    chart: {
      height: 350,
      type: "heatmap",
      toolbar: {
        show: false,
      },
    },
    dataLabels: {
      enabled: false,
    },
    colors: ["#CD5C5C"],
    title: {
      text: "ΔG_cross(selected) / ΔG_pair_in_length",
      align: "center",
      style: {  
        fontSize:  '14px',
        fontWeight:  500,
        fontFamily:  "Arial black, sans-serif",
        color:  '#301500'
      },
    },
    legend: {
      show: false,
    },
    xaxis: {
      type: "category",
      position: "top",
      labels: {
        show: true,
        rotate: 45,
        rotateAlways: true,
        hideOverlappingLabels: false,
        maxHeight: 120,
        offsetX: 3,
        offsetY: 60,
        style: {
          colors: [],
          fontSize: "14px",
          fontFamily: "Helvetica, Arial, sans-serif",
          fontWeight: 500,
          cssClass: "apexcharts-xaxis-label",
        },
      },
      title: {
        text: "Selected",
        offsetX: 0,
        offsetY: 0,
        style: {
          color: undefined,
          fontSize: "12px",
          fontFamily: "Helvetica, Arial, sans-serif",
          fontWeight: 600,
          cssClass: "apexcharts-xaxis-title",
        },
      },
    },
    yaxis: {
      opposite: false,
      reversed: true,
      labels: {
        show: true,
        align: "left",
        minWidth: 0,
        maxWidth: 160,
        offsetX: 22,
        offsetY: 0,
        style: {
          colors: [],
          fontSize: "14px",
          fontFamily: "Helvetica, Arial, sans-serif",
          fontWeight: 500,
          cssClass: "apexcharts-yaxis-label",
        },
      },
      title: {
        text: "Pass",
        rotate: -90,
        offsetX: 0,
        offsetY: 0,
        style: {
          color: undefined,
          fontSize: "12px",
          fontFamily: "Helvetica, Arial, sans-serif",
          fontWeight: 600,
          cssClass: "apexcharts-yaxis-title",
        },
      },
    },
    plotOptions: {
      heatmap: {
        // distributed: true,
        // radius: 10,
        // reverseNegativeShade: false,
        colorScale: {
          ranges: [
            {
              from: 1,
              to: 1,
              color: "#FFB844",
              name: "Pair",
            },
            {
              from: 0,
              to: threshold / 100,
              color: "#1F618D",
              name: "Non-specific",
            },
            {
              from: 0,
              to: threshold / 2 / 100,
              color: "#3498DB",
              name: "Non-specific",
            },
            {
              from: 0,
              to: 0,
              color: "#FFFFFF",
            },
          ],
        },
      },
    },
  };
  $("#chart_select").empty();
  var chart_select = new ApexCharts(document.querySelector("#chart_select"), options);
  chart_select.render();
}

function heatmapForHairpin(pairs, complete, resultObj, threshold) {
  var seriesArr = [];

  for (var i = 0; i < pairs; i++) {
    seriesArr[i] = { name: i, data: [{ x: "/ ΔG_pair", y: (resultObj[i].hair / resultObj[i].duplex).toFixed(2) }] };
  }

  var options = {
    series: seriesArr, // data 붙여넣기
    chart: {
      height: 350,
      type: "heatmap",
      toolbar: {
        show: false,
      },
    },
    dataLabels: {
      enabled: false,
    },
    colors: ["#CD5C5C"],
    title: {
      text: "　",
      align: "center",
    },
    legend: {
      show: false,
    },
    xaxis: {
      type: "category",
      position: "top",
      labels: {
        show: true,
        rotate: 0,
        rotateAlways: true,
        hideOverlappingLabels: false,
        maxHeight: 120,
        offsetX: 10,
        offsetY: 20,
        style: {
          colors: '#301500',
          fontSize: "14px",
          fontFamily: "Arial black, sans-serif",
          fontWeight: 500,
          cssClass: "apexcharts-xaxis-label",
        },
      },
      title: {
        text: "ΔG_hairp.",
        offsetX: -10,
        offsetY: 5,
        style: {
          color: '#301500',
          fontSize: "14px",
          fontFamily: "Arial black, sans-serif",
          fontWeight: 500,
          cssClass: "apexcharts-xaxis-title",
        },
      },
      tooltip: {
        enabled: false,
        formatter: undefined,
        offsetY: 0,
        style: {
          fontSize: 0,
          fontFamily: 0,
        },
      },
    },
    yaxis: {
      opposite: false,
      reversed: true,
      labels: {
        show: true,
        align: "left",
        minWidth: 0,
        maxWidth: 160,
        offsetX: 22,
        offsetY: 0,
        style: {
          colors: [],
          fontSize: "14px",
          fontFamily: "Helvetica, Arial, sans-serif",
          fontWeight: 500,
          cssClass: "apexcharts-yaxis-label",
        },
      },
      title: {
        text: "Pass",
        rotate: -90,
        offsetX: 0,
        offsetY: 0,
        style: {
          color: undefined,
          fontSize: "12px",
          fontFamily: "Helvetica, Arial, sans-serif",
          fontWeight: 600,
          cssClass: "apexcharts-yaxis-title",
        },
      },
    },
    plotOptions: {
      heatmap: {
        // distributed: true,
        // radius: 10,
        // reverseNegativeShade: false,
        colorScale: {
          ranges: [
            {
              from: 1,
              to: 1,
              color: "#FFB844",
              name: "Pair",
            },
            {
              from: 0,
              to: threshold / 100,
              color: "#1F618D",
              name: "Non-specific",
            },
            {
              from: 0,
              to: threshold / 2 / 100,
              color: "#3498DB",
              name: "Non-specific",
            },
            {
              from: 0,
              to: 0,
              color: "#FFFFFF",
            },
          ],
        },
      },
    },
  };
  $("#chart_hair").empty();
  var chart_hair = new ApexCharts(document.querySelector("#chart_hair"), options);
  chart_hair.render();
}

function heatmapForCrossPairs(pairs, complete, resultObj, threshold) {
  //heatmap data 초기화******************************
  var seriesArr = [];

  for (var i = 0; i < pairs; i++) {
    seriesArr[2 * i] = { name: i + "+", data: [] };
    seriesArr[2 * i + 1] = { name: i + "-", data: [] };

    for (var j = 0; j < pairs; j++) {
      seriesArr[2 * i].data.push({ x: j + "+", y: "0" });
      seriesArr[2 * i].data.push({ x: j + "-", y: "0" });
      seriesArr[2 * i + 1].data.push({ x: j + "+", y: "0" });
      seriesArr[2 * i + 1].data.push({ x: j + "-", y: "0" });
    }
  }
  //heatmap data 초기화******************************end

  for (var i = 0; i < complete; i++) {
    seriesArr[2 * i].data[2 * i].y = (resultObj[i].cross.NPvsSelf / resultObj[i].duplex).toFixed(2);
    seriesArr[2 * i].data[2 * i + 1].y = resultObj[i].duplex / resultObj[i].duplex;
    seriesArr[2 * i + 1].data[2 * i].y = resultObj[i].duplex / resultObj[i].duplex;
    seriesArr[2 * i + 1].data[2 * i + 1].y = (resultObj[i].cross.NMvsSelf / resultObj[i].duplex).toFixed(2);
    for (var j = 0; j < i; j++) {
      seriesArr[2 * i].data[2 * j].y = (resultObj[i].cross.NPvsPass[j].p / resultObj[i].duplex).toFixed(2);
      seriesArr[2 * i].data[2 * j + 1].y = (resultObj[i].cross.NPvsPass[j].m / resultObj[i].duplex).toFixed(2);
      seriesArr[2 * i + 1].data[2 * j].y = (resultObj[i].cross.NMvsPass[j].p / resultObj[i].duplex).toFixed(2);
      seriesArr[2 * i + 1].data[2 * j + 1].y = (resultObj[i].cross.NMvsPass[j].m / resultObj[i].duplex).toFixed(2);
    }
  }

  var options = {
    series: seriesArr, // data 붙여넣기
    chart: {
      height: 350,
      type: "heatmap",
      toolbar: {
        show: false,
      },
    },
    dataLabels: {
      enabled: false,
    },
    colors: ["#CD5C5C"],
    title: {
      text: "ΔG_cross(completed) / ΔG_pair",
      align: "center",
      style: {  
        fontSize:  '14px',
        fontWeight:  500,
        fontFamily:  "Arial black, sans-serif",
        color:  '#301500'
      },
    },
    legend: {
      show: false,
    },
    xaxis: {
      type: "category",
      position: "top",
      labels: {
        show: true,
        rotate: 45,
        rotateAlways: true,
        hideOverlappingLabels: false,
        maxHeight: 120,
        offsetX: 3,
        offsetY: 35,
        style: {
          colors: [],
          fontSize: "14px",
          fontFamily: "Helvetica, Arial, sans-serif",
          fontWeight: 500,
          cssClass: "apexcharts-xaxis-label",
        },
      },
      title: {
        text: "Completed",
        offsetX: 0,
        offsetY: 0,
        style: {
          color: undefined,
          fontSize: "12px",
          fontFamily: "Helvetica, Arial, sans-serif",
          fontWeight: 600,
          cssClass: "apexcharts-xaxis-title",
        },
      },
    },
    yaxis: {
      opposite: false,
      reversed: true,
      labels: {
        show: true,
        align: "left",
        minWidth: 0,
        maxWidth: 160,
        offsetX: 22,
        offsetY: 0,
        style: {
          colors: [],
          fontSize: "14px",
          fontFamily: "Helvetica, Arial, sans-serif",
          fontWeight: 500,
          cssClass: "apexcharts-yaxis-label",
        },
      },
      title: {
        text: undefined,
        rotate: -90,
        offsetX: 0,
        offsetY: 0,
        style: {
          color: undefined,
          fontSize: "12px",
          fontFamily: "Helvetica, Arial, sans-serif",
          fontWeight: 600,
          cssClass: "apexcharts-yaxis-title",
        },
      },
    },
    plotOptions: {
      heatmap: {
        // distributed: true,
        // radius: 10,
        // reverseNegativeShade: false,
        colorScale: {
          ranges: [
            {
              from: 1,
              to: 1,
              color: "#FFB844",
              name: "Pair",
            },
            {
              from: 0,
              to: threshold / 100,
              color: "#1F618D",
              name: "Non-specific",
            },
            {
              from: 0,
              to: threshold / 2 / 100,
              color: "#3498DB",
              name: "Non-specific",
            },
            {
              from: 0,
              to: 0,
              color: "#FFFFFF",
            },
          ],
        },
      },
    },
  };
  $("#chart_pairs").empty();
  var chart_pairs = new ApexCharts(document.querySelector("#chart_pairs"), options);
  chart_pairs.render();
}
