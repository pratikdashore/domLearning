//download.js v4.2, by dandavis; 2008-2016. [CCBY2] see http://danml.com/download.html for tests/usage
// v1 landed a FF+Chrome compat way of downloading strings to local un-named files, upgraded to use a hidden frame and optional mime
// v2 added named files via a[download], msSaveBlob, IE (10+) support, and window.URL support for larger+faster saves than dataURLs
// v3 added dataURL and Blob Input, bind-toggle arity, and legacy dataURL fallback was improved with force-download mime and base64 support. 3.1 improved safari handling.
// v4 adds AMD/UMD, commonJS, and plain browser support
// v4.1 adds url download capability via solo URL argument (same domain/CORS only)
// v4.2 adds semantic variable names, long (over 2MB) dataURL support, and hidden by default temp anchors
// https://github.com/rndme/download

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define([], factory);
    } else if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory();
    } else {
        // Browser globals (root is window)
        root.download = factory();
    }
}(this, function () {

    return function download(data, strFileName, strMimeType) {

        var self = window, // this script is only for browsers anyway...
            defaultMime = "application/octet-stream", // this default mime also triggers iframe downloads
            mimeType = strMimeType || defaultMime,
            payload = data,
            url = !strFileName && !strMimeType && payload,
            anchor = document.createElement("a"),
            toString = function (a) { return String(a); },
            myBlob = (self.Blob || self.MozBlob || self.WebKitBlob || toString),
            fileName = strFileName || "download",
            blob,
            reader;
        myBlob = myBlob.call ? myBlob.bind(self) : Blob;

        if (String(this) === "true") { //reverse arguments, allowing download.bind(true, "text/xml", "export.xml") to act as a callback
            payload = [payload, mimeType];
            mimeType = payload[0];
            payload = payload[1];
        }


        if (url && url.length < 2048) { // if no filename and no mime, assume a url was passed as the only argument
            //var myRegexp = /(\d+\.mp4)/g;
            //var match = myRegexp.exec(uri)[1];
            //fileName = match.split('').splice(0, match.indexOf('.mp4')).join('');
            fileName = url.split("/").pop().split("?")[0];
            anchor.href = url; // assign href prop to temp anchor
            if (anchor.href.indexOf(url) !== -1) { // if the browser determines that it's a potentially valid url path:
                var ajax = new XMLHttpRequest();
                ajax.open("GET", url, true);
                ajax.responseType = 'blob';
                ajax.onload = function (e) {
                    download(e.target.response, fileName, defaultMime);
                };
                setTimeout(function () { ajax.send(); }, 0); // allows setting custom ajax headers using the return:
                return ajax;
            } // end if valid url?
        } // end if url?


        //go ahead and download dataURLs right away
        if (/^data\:[\w+\-]+\/[\w+\-]+[,;]/.test(payload)) {

            if (payload.length > (1024 * 1024 * 1.999) && myBlob !== toString) {
                payload = dataUrlToBlob(payload);
                mimeType = payload.type || defaultMime;
            } else {
                return navigator.msSaveBlob ?  // IE10 can't do a[download], only Blobs:
                    navigator.msSaveBlob(dataUrlToBlob(payload), fileName) :
                    saver(payload); // everyone else can save dataURLs un-processed
            }

        }//end if dataURL passed?

        blob = payload instanceof myBlob ?
            payload :
            new myBlob([payload], { type: mimeType });


        function dataUrlToBlob(strUrl) {
            var parts = strUrl.split(/[:;,]/),
                type = parts[1],
                decoder = parts[2] == "base64" ? atob : decodeURIComponent,
                binData = decoder(parts.pop()),
                mx = binData.length,
                i = 0,
                uiArr = new Uint8Array(mx);

            for (i; i < mx; ++i) uiArr[i] = binData.charCodeAt(i);

            return new myBlob([uiArr], { type: type });
        }

        function saver(url, winMode) {

            if ('download' in anchor) { //html5 A[download]
                anchor.href = url;
                anchor.setAttribute("download", fileName);
                anchor.className = "download-js-link";
                anchor.innerHTML = "downloading...";
                anchor.style.display = "none";
                document.body.appendChild(anchor);
                setTimeout(function () {
                    anchor.click();
                    document.body.removeChild(anchor);
                    if (winMode === true) { setTimeout(function () { self.URL.revokeObjectURL(anchor.href); }, 250); }
                }, 66);
                return true;
            }

            // handle non-a[download] safari as best we can:
            if (/(Version)\/(\d+)\.(\d+)(?:\.(\d+))?.*Safari\//.test(navigator.userAgent)) {
                url = url.replace(/^data:([\w\/\-\+]+)/, defaultMime);
                if (!window.open(url)) { // popup blocked, offer direct download:
                    if (confirm("Displaying New Document\n\nUse Save As... to download, then click back to return to this page.")) { location.href = url; }
                }
                return true;
            }

            //do iframe dataURL download (old ch+FF):
            var f = document.createElement("iframe");
            document.body.appendChild(f);

            if (!winMode) { // force a mime that will download:
                url = "data:" + url.replace(/^data:([\w\/\-\+]+)/, defaultMime);
            }
            f.src = url;
            setTimeout(function () { document.body.removeChild(f); }, 333);

        }//end saver




        if (navigator.msSaveBlob) { // IE10+ : (has Blob, but not a[download] or URL)
            return navigator.msSaveBlob(blob, fileName);
        }

        if (self.URL) { // simple fast and modern way using Blob and URL:
            saver(self.URL.createObjectURL(blob), true);
        } else {
            // handle non-Blob()+non-URL browsers:
            if (typeof blob === "string" || blob.constructor === toString) {
                try {
                    return saver("data:" + mimeType + ";base64," + self.btoa(blob));
                } catch (y) {
                    return saver("data:" + mimeType + "," + encodeURIComponent(blob));
                }
            }

            // Blob but not URL support:
            reader = new FileReader();
            reader.onload = function (e) {
                saver(this.result);
            };
            reader.readAsDataURL(blob);
        }
        return true;
    }; /* end download() */
}));


(function () {

    function getPromise(item, idx, timeout) {
        return new Promise(function (resolve, reject) {
            setTimeout(function () {
                item.click();
                setTimeout(function () {
                    try {
                        downloadVideo(document.getElementsByTagName('video')[0].src, getCleanStr(item.innerText), idx);
                        resolve({ url: item.innerText, status: true });
                    } catch (error) {
                        resolve({ url: item.innerText, status: false });
                    }
                }, 1000);
            }, timeout);
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

    function downloadVideo(uri, name, idx) {
        // var link = document.createElement('a'),
        var names = {},
            myRegexp = /(\d+\.mp4)/g,
            adder = 0,
            endTime, hitTime, match, mValue;

        // link.setAttribute('download', name);
        // link.href = uri;
        // link.target = '_self';

        match = myRegexp.exec(uri)[1];

        mValue = match.split('').splice(0, match.indexOf('.mp4')).join('');

        nameKeys.forEach(function (kv) {
            if (kv.key.indexOf(mValue) > -1) {
                adder += 1;
            }
        });

        names.key = adder > 0 ? mValue + '(' + adder + ')' : mValue;
        names.key += '.mp4';
        names.value = name;

        nameKeys.push(names);
        endTime = Date.now();
        hitTime = (endTime - startTime) / 1000;
        console.log('Hitted ' + name + ' After ' + hitTime + ' secs');
        startTime = Date.now();
        // document.body.appendChild(link);
        // link.click();
        // document.body.removeChild(link);
        var fileName = (idx + 1) + '. ' + name + '.mp4';
        download(uri);
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
        radn.push(Math.floor((Math.random() * (20000 - 10000)) + 15000));
    }

    radn.sort(function (a, b) { return a - b; });

    if (titleList.length > 0) {
        titleList.forEach(function (item, idx) {
            var p = getPromise(item, idx, (radn[idx]) * idx);
            promiseList.push(p);
        });
        Promise.all(promiseList).then(function () {
            finalyDownload();
        });
    }

    function finalyDownload() {
        var duplicates = {};
        var printStr = 'mkdir ' + '"' + cource + '";' + '\r\n';

        nameKeys.forEach(function (item, idx) {
            var counter = idx + 1;
            var choosenIdx = 0;
            var folderFileRecords = folderFiles.filter((data) => data.fileName.includes(item.value));
            if (folderFileRecords.length > 1) {
                if (!duplicates[item.value]) {
                    duplicates[item.value] = 0;
                }
                choosenIdx = duplicates[item.value];
                duplicates[item.value] += 1;
            }
            var folderFile = folderFileRecords[choosenIdx];
            var msg = 'ren ' + '"1280x' + item.key + '"' + ' ' + '"' + folderFile.fileName + '.mp4' + '"' + ';' + '\r\n';
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
