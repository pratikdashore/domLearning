(function () {

  function getPromise(item, idx) {
    return new Promise(function (resolve, reject) {
      setTimeout(function () {
        item.click();
        setTimeout(function () {
          try {
            downloadVideo(document.getElementsByTagName('video')[0].src, getCleanStr(item.innerText));
            resolve({ url: item.innerText, status: true });
          } catch (error) {
            resolve({ url: item.innerText, status: false });
          }
        }, 1000);
      }, idx);
    });
  }


  function getCleanStr(str) {
    return str.replace(/[^\w\s]/gi, '_');
  }

  function downloadBatchFile(fileName, fileContent) {
    var file = "data:text/plain;charset=utf-8,";
    var encoded = encodeURIComponent(fileContent);
    file += encoded;
    var a = document.createElement('a');
    a.href = file;
    a.target = '_blank';
    a.download = fileName + '.bat';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  function downloadVideo(uri, name) {
    var link = document.createElement('a'),
      names = {},
      myRegexp = /(\d+\.mp4)/g,
      adder = 0,
      endTime, hitTime, match, mValue;

    link.setAttribute('download', name);
    link.href = uri;

    match = myRegexp.exec(uri)[1];

    mValue = match.split('').splice(0, match.indexOf('.mp4')).join('');

    nameKeys.forEach(function (kv) {
      if (kv.key.indexOf(mValue) > -1) {
        adder += 1;
      }
    });

    names.key = adder > 0 ? mValue + ' (' + adder + ')' : mValue;
    names.key += '.mp4';
    names.value = name;

    nameKeys.push(names);
    endTime = Date.now();
    hitTime = (endTime - startTime) / 1000;
    console.log('Hitted ' + name + ' After ' + hitTime + ' secs');
    startTime = Date.now();
    link.click();
    link.remove();
  }

  var cource = getCleanStr(document.getElementById('course-title-link').innerText);

  var list = document.querySelectorAll('section.module'),
    nameKeys = [],
    counter = 0,
    folderCounter = 0,
    titleList = [],
    startTime = Date.now(),
    folderFiles = [],
    folders = [],
    promiseList = [];

  for (var i = 0; i < list.length; i++) {

    var headerText = getCleanStr(list[i].getElementsByTagName('h2')[0].innerText);
    var liList = list[i].querySelectorAll('ul.clips li h3');
    if (liList.length > 1) {
      //console.log('mkdir '+'"'+(i+1)+'.'+headerText+'"');
      console.log('------' + headerText + '------');
      folderCounter += 1;
      var folder = folderCounter + '. ' + headerText;
      for (var y = 0; y < liList.length; y++) {
        counter += 1;
        var file = counter + '. ' + getCleanStr(liList[y].innerText);
        var ltm = {
          folderName: folder,
          fileName: file
        };

        console.log(counter + ' - ' + getCleanStr(liList[y].innerText));

        folderFiles.push(ltm);
        titleList.push(liList[y]);
      }
      folders.push(folder);
      console.log('');
      console.log('');
    }

  }

  var radn = [];

  for (var k = 0; k < titleList.length; k++) {
    radn.push(Math.floor((Math.random() * (40000 - 20000)) + 30000));
  }

  radn.sort(function (a, b) { return a - b; });

  if (titleList.length > 0) {
    titleList.forEach(function (item, idx) {
      var p = getPromise(item, (radn[idx]) * idx);
      promiseList.push(p);
    });
    Promise.all(promiseList).then(function () {
      finalyDownload();
    });
  }

  function finalyDownload() {
    var printStr = 'mkdir ' + '"' + cource + '";' + '\r\n';
    nameKeys.forEach(function (item, idx) {
      var counter = idx + 1;
      var msg = 'ren ' + '"' + item.key + '"' + ' ' + '"' + counter + '. ' + item.value + '.mp4' + '"' + ';' + '\r\n';
      printStr += msg;
    });

    folders.forEach(function (item) {
      var msg = 'mkdir ' + '"' + item + '";' + '\r\n';
      printStr += msg;
    });

    folderFiles.forEach(function (item) {
      var msg = 'move ' + '"' + item.fileName + '.mp4"' + ' "' + item.folderName + '/' +
        item.fileName + '.mp4"' + ';' + '\r\n';
      printStr += msg;
    });

    folders.forEach(function (item) {
      var msg = 'move ' + '"' + item + '"' + ' "' + cource + '";\r\n';
      printStr += msg;
    });
    downloadBatchFile(cource, printStr);
    console.log(printStr);
  }
}());
