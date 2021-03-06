//-------- find in files options
var lastChoices = [];
var fileTypes = ["*.html;*.js;*.css;*.json", "*.waProject;*.waSolution;*.waPerm;*.waModel;*.waSettings"];
var currentPage = 0;
var nbPages = 1;
var results = [];
var running = false;
var selected = -1;
var firstIdInPage = 0;
var lastIdInPage = 0;
var onClickPressKeyCooldown = true;
var options = {};
options.caseSensitive = false;
options.wholeWord = false;
options.keepOpened = false;
options.patternType = "plainText";
options.mode = "solution";
options.folder = "";
options.fileTypes = fileTypes[0];
document.getElementById("fileTypesInput").value = options.fileTypes;
var projects = studio.currentSolution.getProjects();
shortcut.add('return', findAll);
shortcut.add('enter', findAll);
shortcut.add('pageup', firstPage);
shortcut.add('pagedown', lastPage);
shortcut.add('up', upArrow);
shortcut.add('down', downArrow);
document.getElementById("toSearchInput").focus();

function upArrow() {
    if (selected != -1) {
        selectRow({
            row: selected - 1,
            scroll: true,
            replace: false
        });
    } else if (results.length > 0) {
        selectRow({
            row: lastIdInPage,
            scroll: true,
            replace: false
        });
    }
}

function downArrow() {
    if (selected != -1) { 
        selectRow({
            row: selected + 1,
            scroll: true,
            replace: false
        }); 
    } else if (results.length > 0) { 
        selectRow({
            row: firstIdInPage,
            scroll: true,
            replace: false
        });
     }
}

function setPatternType(a) {
    options.patternType = a;
    var c;
    var classList = document.getElementById("toSearchInput").classList;
    classList.remove('regularExpression');
    classList.remove('wildCards');
    classList.remove('plainText');
    classList.add(a);
    if (a == 'plainText') c = "";
    else if (a == 'regularExpression') c = 'RegEx';
    else if (a == 'wildCards') c = 'Wildcard';
    document.getElementById("patternType").innerHTML = c;
}

function adjustReplaceMenus() {
    document.getElementById("keepOpened").innerHTML = options.keepOpened ? "\u2713" : "";
}

function adjustOptionsMenus() {
    document.getElementById("caseSensitive").innerHTML = options.caseSensitive ? "\u2713" : "";
    document.getElementById("wholeWord").innerHTML = options.wholeWord ? "\u2713" : "";
    document.getElementById("plainText").innerHTML = (options.patternType == 'plainText') ? "\u2713" : "";
    document.getElementById("wildCards").innerHTML = (options.patternType == 'wildCards') ? "\u2713" : "";
    document.getElementById("regularExpression").innerHTML = (options.patternType == 'regularExpression') ? "\u2713" : "";
    var i;
    var content = "";
    for (i = 0; i < lastChoices.length; i++) {
        content += '<a href="#" onclick="setChoice(' + i + ');"><span style="display: inline-block; width: 16px"></span><span>' + lastChoices[i] + '</span></a>';
    }
    document.getElementById("recentSearches").innerHTML = content;
}

function setChoice(id) {
    var search = document.getElementById("toSearchInput");
    search.value = lastChoices[id];
    search.focus();
    search.select();
}

function adjustWhereMenus() {
    document.getElementById("allOpenedDocuments").innerHTML = (options.mode == "allOpenedDocuments") ? "\u2713" : "";
    document.getElementById("solution").innerHTML = (options.mode == "solution") ? "\u2713" : "";
    document.getElementById("folder").innerHTML = (options.mode == "folder") ? "\u2713" : "";
    projects = studio.currentSolution.getProjects();
    var content = "";
    var i;
    if (projects) {
        for (i = 0; i < projects.length; i++) {
            var coche = ((options.mode == "project") && (options.project == projects[i])) ? "\u2713" : "";
            content += '<a href="#" onclick="setProject(' + i + ');"><span style="display: inline-block; width: 16px">' + coche + '</span><span>' + projects[i] + '</span></a>';
        }
    }
    document.getElementById("projects").innerHTML = content;
}

function adjustFileTypesMenus() {
    var content = "";
    var i;
    var current = document.getElementById("fileTypesInput").value;
    if (fileTypes.indexOf(current) == -1) fileTypes.push(current);
    for (i = 0; i < fileTypes.length; i++) {
        var coche = (current == fileTypes[i]) ? "\u2713" : "";
        content += '<a href="#" onclick="setFileTypes(' + i + ');"><span style="display: inline-block; width: 16px">' + coche + '</span><span>' + fileTypes[i] + '</span></a>';
    }
    document.getElementById("fileTypesMenuPlaceHolder").innerHTML = content;
}

function setFileTypes(i) {
    var ft = document.getElementById("fileTypesInput");
    ft.value = fileTypes[i];
    ft.focus();
    ft.select();
}

function setMode(mode) {
    options.mode = mode;
    var dest = document.getElementById("destinationInput");
    dest.classList.remove('active');
    if (options.mode == "folder") {
        if (options.folder == "") browse();
        else {
            dest.readOnly = false;
            dest.value = options.folder;
            dest.classList.add('active');
            dest.select();
        }
    } else if (options.mode == "allOpenedDocuments") {
        dest.value = "Search in all open files";
        dest.readOnly = true;
    } else if (options.mode == "solution") {
        dest.value = "Search in entire solution";
        dest.readOnly = true;
    }
}

function setProject(i) {
    options.mode = "project";
    options.project = projects[i];
    var dest = document.getElementById("destinationInput");
    dest.classList.remove('active');
    dest.readOnly = true;
    dest.value = 'Search in project "' + options.project + '"';
}

function readOptions() {
    options.findWhat = document.getElementById("toSearchInput").value;
    options.fileTypes = document.getElementById("fileTypesInput").value;
    if (options.mode == "folder") {
        options.folder = document.getElementById("destinationInput").value;
        options.includeSubfolders = true;
    }
}

function find() {
    if (onClickPressKeyCooldown) {
        onClickPressKeyCooldown = false;
        readOptions();
        if (options.findWhat != "") {
            options.replaceWith = "";            
            if (selected < results.length) {
                selectRow({
                    row: selected + 1,
                    scroll: true,
                    replace: false
                });
                studio.editor.findInFiles("find", options);
                if (lastChoices.indexOf(options.findWhat) == -1) {
                    lastChoices.push(options.findWhat)
                };
            }
        }
        setTimeout(function() {
            onClickPressKeyCooldown = true;
        }, 50);
    }
}

function replace() {
    if (onClickPressKeyCooldown) {
        onClickPressKeyCooldown = false;
        if (running) {
            studio.editor.findInFiles("stop");
        } else {
            readOptions();
            if (options.findWhat != "") {
                options.replaceWith = document.getElementById("toReplaceInput").value;
                studio.editor.findInFiles("replace", options);
                selectRow({
                    row: selected + 1,
                    scroll: true,
                    replace: true
                });
            }
        }
    }
    setTimeout(function() {
        onClickPressKeyCooldown = true;
    }, 50);
}

function replaceAll() {
    if (onClickPressKeyCooldown) {
        onClickPressKeyCooldown = false;
        if (running) {
            studio.editor.findInFiles("stop");
        } else {
            readOptions();
            if (options.findWhat != "") {
                options.replaceWith = document.getElementById("toReplaceInput").value;
                studio.editor.findInFiles("replaceAll", options);
            }
        }
    }
    setTimeout(function() {
        onClickPressKeyCooldown = true;
    }, 50);
}

function findAll() {
    if (onClickPressKeyCooldown) {
        onClickPressKeyCooldown = false;
        if (running) {
            studio.editor.findInFiles("stop");
        } else {
            readOptions();
            if (options.findWhat != "") {
                selected = -1;
                nbPages = 1;
                results = [];
                running = true;
                currentPage = 0;
                options.replaceWith = "";
                studio.editor.findInFiles("findAll", options);
                //console.log('studio.editor.findInFiles("findAll", '+JSON.stringify(options)+');')
                document.getElementById("findAllButton").innerHTML = "Stop";
                document.getElementById("resultsBar").style.visibility = "visible";
                document.getElementById("resultsTable").style.visibility = "visible";
                document.getElementById("resultsTable").innerHTML = "";
                document.getElementById("resultsNotFound").style.display = "none";
                document.getElementById("spinner").style.visibility = "visible";
                document.getElementById("resultsCounter").innerHTML = "0 results found";
                document.getElementById("pageCounter").innerHTML = "1/1"
                setTimeout(function() {
                    getResults();
                }, 100);
            }
        }
        setTimeout(function() {
            onClickPressKeyCooldown = true;
        }, 50);
    }
}

function firstPage() {
    if (currentPage > 0) {
        currentPage = 0;
        selected = -1;
        document.getElementById("resultsTable").innerHTML = "";
        firstIdInPage = currentPage * 40;
        fillPage(currentPage * 40);
    }
}

function lastPage() {
    currentPage = Math.floor((results.length / 40) + 1) - 1;
    selected = -1;
    document.getElementById("resultsTable").innerHTML = "";
    firstIdInPage = currentPage * 40;
    fillPage(firstIdInPage);
}

function nextPage() {
    if (((currentPage + 1) * 40) < results.length) {
        currentPage++;
        selected = -1;
        document.getElementById("resultsTable").innerHTML = "";
        firstIdInPage = currentPage * 40;
        fillPage(firstIdInPage);
    }
}

function previousPage() {
    if (currentPage > 0) {
        currentPage--;
        selected = -1;
        document.getElementById("resultsTable").innerHTML = "";
        firstIdInPage = currentPage * 40;
        fillPage(firstIdInPage);
    }
}

function fold(i) {
    i.parentNode.parentNode.classList.toggle("collapse");
}

function fillPage(previousNbResults) {
    var startPage = currentPage * 40;
    var endPage = (currentPage + 1) * 40
    if ((previousNbResults >= startPage) && (previousNbResults < endPage)) {
        var limit = results.length;
        if (limit > endPage) limit = endPage;
        lastIdInPage = limit - 1;
        var content = "";
        var lastPath = "";
        if ((previousNbResults > 0) && (previousNbResults != startPage)) lastPath = results[previousNbResults - 1].path;
        var j = 0;
        var i;
        var color;
        for (i = previousNbResults; i < limit; i++) {
            if (results[i].path != lastPath) {
                lastPath = results[i].path;
                var extension = lastPath.slice(lastPath.length - 5, lastPath.length);
                if (extension == '.html') color = "#3a98d8";
                else if (extension == '.json') color = "#f24112";
                else {
                    extension = lastPath.slice(lastPath.length - 4, lastPath.length);
                    if (extension == '.css') color = "#2aaa90";
                    else {
                        extension = lastPath.slice(lastPath.length - 3, lastPath.length);
                        if (extension == '.js') color = "#e47e30";
                        else color = "#fbb500";
                    }
                }
                if (j > 0) content += '</table><div style="clear: both"></div></div></div>';
                content += '<div class="block">';
                content += '<div class="file" style="border-left:5px solid ' + color + '">';
                content += '<div class="collapseButton" onclick="fold(this)">';
                content += '</div>';
                var img = studio.getFileIcon(lastPath);
                content += '<img src="' + img + '" />';
                var resultPath = htmlify(results[i].path);
                var resultPathString = '';
                if (navigator.userAgent.indexOf('Mac OS X') != -1) {
                    resultPath = resultPath.replace(/:/g, '/').split('/');
                    resultPath.forEach(function(subPath, i) {
                        resultPathString += '<span>' + subPath + '</span>';
                        if (i < resultPath.length - 1) {
                            resultPathString += '<span>/</span>';
                        }
                    });
                } else {
                    resultPath = resultPath.split('\\');
                    resultPath.forEach(function(subPath, i) {
                        resultPathString += '<span>' + subPath + '</span>';
                        if (i < resultPath.length - 1) {
                            resultPathString += '<span>\\</span>';
                        }
                    });
                }
                content += '<div class="path">' + resultPathString + '</div>';
                content += '</div>';
                content += '<div class="tableBlock">'
                content += '<table style="width: 100%">';
                j++;
            }
            content += '<tr id="r' + i + '" class="searchRow" onclick="selectRow({ row: ' + i + ', scroll: true, replace: false })">';
            content += '<td>';
            content += '<b>' + results[i].row + '</b></td>';
            var codeLine = results[i].content;
            var before, searchText, after;
            var start = results[i].column - 2;
            before = codeLine.slice(0, start);
            searchText = codeLine.slice(start, start + results[i].len);
            after = codeLine.slice(start + results[i].len, codeLine.length);
            codeLine = before + '__START__' + searchText + '__END__' + after;
            codeLine = htmlify(codeLine);
            codeLine = codeLine.replace('__START__', '<span style="background-color: ' + color + '">');
            codeLine = codeLine.replace('__END__', '</span>');
            content += '<td>' + codeLine + "</td></tr>"
        }
        if (j > 0) content += '</table><div style="clear: both"></div></div></div>';
        document.getElementById("resultsTable").innerHTML += content;
    }
    document.getElementById("pageCounter").innerHTML = currentPage + 1 + "/" + Math.floor((results.length / 40) + 1);
}

function applySelect(rowNumber, scroll) {
    var r = document.getElementById("r" + rowNumber);
    r.classList.add("selected");
    r.parentNode.parentNode.parentNode.parentNode.classList.remove("collapse");
    if (scroll) {
        r.scrollIntoView();
    }
}

function selectRow(options) {
    var i = options.row,
        scroll = options.scroll,
        replace = options.replace;
        
    if (results.length > 0) {
        $('.selected').removeClass('selected');
        if (replace) {
            selected = i;
            applySelect(selected);
        } else {
            if (i >= 0 && i < results.length) {
                if (i > lastIdInPage) nextPage();
                if (i < firstIdInPage) previousPage();
                studio.editor.openFindInFilesResult(results[i].pos, results[i].row, results[i].column, results[i].len, results[i].path);
                selected = i;
                applySelect(selected);
            } else {
                selected = i = -1;
            }
        }
    }
    return false;
}

function getResults() {
    var res = studio.editor.getFindResults(results.length);
    var previousNbResults = results.length;
    results = results.concat(res.results);
    
    var newNbResults = results.length;
    if (newNbResults > 0) {
        document.getElementById("scrollBox").classList.add("active");
    }
    if (newNbResults > previousNbResults) {
        fillPage(previousNbResults);
        document.getElementById("resultsCounter").innerHTML = results.length + " results found";
    }
    running = res.running;
    if (running) {
        setTimeout(function() {
            getResults();
        }, 100);
    } else {
        document.getElementById("findAllButton").innerHTML = "Find All";
        document.getElementById("spinner").style.visibility = "hidden";
        if (results.length == 0) {
            document.getElementById("resultsBar").style.visibility = "hidden";
            document.getElementById("resultsTable").style.visibility = "hidden";
            document.getElementById("resultsNotFound").style.display = "block";
            document.getElementById("resultsNotFoundKey").innerHTML = options.findWhat;
            document.getElementById('toSearch').style.border = '1px solid #f24112'
            document.getElementById("scrollBox").classList.remove("active");
        }
    }
}

function browse() {
    var folder = studio.folderSelectDialog();
    if (folder) {
        options.mode = "folder";
        options.folder = folder.systemPath || folder.path;
        var dest = document.getElementById("destinationInput");
        dest.readOnly = false;
        dest.value = options.folder;
        dest.classList.add('active');
        dest.focus();
        dest.select();
    }
}

function htmlify($text) {
    // First, translate special characters to HTML
    $text = spchrs2html($text);
    // Now put the breaks on
    $text = $text.replace(/\n/g, "<br/>");
    // And deal with multiple spaces
    $text = $text.replace(/\ \ /g, " &nbsp;");
    // And any other specials
    $text = $text.replace(/"/g, "&quot;");
    $text = $text.replace(/\$/g, "&#36;");
    return $text;
}

function spchrs2html(str) {
    str = str.replace(/&/g, "&amp;");
    str = str.replace(/</g, "&lt;"); // Convert angle brackets to HTML codes in string
    str = str.replace(/>/g, "&gt;");
    return str;
}
//-------- menu stuff
var timeout = 500;
var closetimer = 0;
var ddmenuitem = 0;
// open hidden layer
function mopen(id) {
    // cancel close timer
    mcancelclosetime();
    // close old layer
    if (ddmenuitem) ddmenuitem.style.visibility = 'hidden';
    // get new layer and show it
    ddmenuitem = document.getElementById(id);
    ddmenuitem.style.visibility = 'visible';
}
// close showed layer
function mclose() {
    if (ddmenuitem) ddmenuitem.style.visibility = 'hidden';
}
// go close timer
function mclosetime() {
    closetimer = window.setTimeout(mclose, timeout);
}
// cancel close timer
function mcancelclosetime() {
    if (closetimer) {
        window.clearTimeout(closetimer);
        closetimer = null;
    }
}
// close layer when click-out
document.onclick = mclose;