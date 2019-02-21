var helmet_popup_arr = [];
var _blacklisted_members = [];
var _blacklisters = [];
var _LIGHT_RED_ = "#faa5a5";

function addToHelmetPopupArr(custid, displayName) {
    var idx = helmet_popup_arr.objIndexOf(custid, "custid");
    if (idx == -1) {
        helmet_popup_arr.push({
            custid: custid,
            displayName: decodeURIComponent(displayName),
            friend: FriendsListing[custid] ? FriendsListing[custid] : 0,
            watch: WatchedListing[custid] ? 1 : 0,
            blacklisted: isBlacklisted(custid)
        });
    }
}

function addHelmetPopup(parent, custid, name, callback) {
    parent.custid = custid;
    parent.onmouseover = function () {
        mashPopupHelmet(this, this.custid, callback);
    };
    parent.onmouseout = function (event) {
        removePopupOnBody(this, event);
    };
    addToHelmetPopupArr(custid, name);
}

function removeHelmetPopup() {
    var e = el("helmetPopup");
    $(e).remove();
}

var secactivepopup = {
    popup: null,
    layernode: null
};
var secpopuptimer = null;
var secpopuptimerover = null;

function buildPopupToolTipHelmet(data, left, top) {
    var popup = element("div", {
        innerHTML: unescape(data.innerHTML)
    }, {
        zIndex: "9999",
        position: "absolute",
        top: top + "px",
        left: left + "px",
        padding: "5px",
        backgroundColor: "white",
        border: "1px solid black",
        textAlign: "left",
        fontSize: "7pt"
    });
    popup.onmouseout = function (e) {
        removePopupOnBody(this.parentNode, e);
    };
    return popup;
}

function mashPopupToolTipHelmet(layernode, innerHTML, left, top) {
    var offsets = getOffsets(layernode);
    buildPopupOnBody({
        innerHTML: innerHTML
    }, layernode, buildPopupToolTipHelmet, offsets.left + left, offsets.top + top);
}

function isHelmetPopupVisible() {
    var e = el("helmetPopup");
    if (e) {
        return true;
    }
    return false;
}


function buildPopupHelmet(data, left, top) {
    var popup = null;
    
    try {
        popup = element("div", {
            id: "helmetPopup"
        }, {
            zIndex: "3",
            position: "absolute",
            top: top + "px",
            left: left + "px",
            padding: "5px",
            backgroundColor: "white",
            border: "1px solid black",
            textAlign: "left"
        });
        var viewdriverlink = popup.appendChild(element("a", {
            innerHTML: "View Driver",
            href: contextpath + "/member/CareerStats.do?custid=" + data.custid,
            className: "driverlink"
        }));
        var addfriendlink = popup.appendChild(element("div", {
            innerHTML: ["Send Friend Request", "Remove Friend", "Revoke Friend Request", "Accept Friend Request"][data.friend],
            className: "driver_popup"
        }));
        //	addfriendlink.onclick=addremovefriend(data);
        switch (data.friend) {
        case 0:
            addfriendlink.onclick = sendfriendrequest(data);
            break;
        case 1:
            addfriendlink.onclick = removefriend(data);
            break;
        case 2:
            addfriendlink.onclick = revokefriendrequest(data);
            break;
        case 3:
            addfriendlink.onclick = acceptfriendrequest(data);
            break;
        default:
        }

        addfriendlink.onmouseover = function (e) {
            this.className = "driver_popup_hover";
        };
        addfriendlink.onmouseout = function (e) {
            this.className = "driver_popup";
        };
        var addwatchlink = popup.appendChild(element("div", {
            innerHTML: ["Add Studied", "Remove Studied"][data.watch],
            className: "driver_popup"
        }));
        addwatchlink.onclick = addremovewatch(data);
        addwatchlink.onmouseover = function (e) {
            this.className = "driver_popup_hover";
        };
        addwatchlink.onmouseout = function (e) {
            this.className = "driver_popup";
        };
        var pmlink = popup.appendChild(element("div", {
            innerHTML: "Private Message",
            className: "driver_popup"
        }));
        //pmlink.onclick=sendpm(data.displayName);
        pmlink.onclick = sendjforumpm(data.custid);
        pmlink.onmouseover = function (e) {
            this.className = "driver_popup_hover";
        };
        pmlink.onmouseout = function (e) {
            this.className = "driver_popup";
        };
        var forumprofilelink = popup.appendChild(element("div", {
            innerHTML: "Forum Profile",
            className: "driver_popup"
        }));
        forumprofilelink.onclick = visitjforumprofile(data.custid);
        //pmlink.onclick=sendpm(data.displayName);
        forumprofilelink.onmouseover = function (e) {
            this.className = "driver_popup_hover";
        };
        forumprofilelink.onmouseout = function (e) {
            this.className = "driver_popup";
        };
        var blacklistlink = popup.appendChild(element("div", {
            innerHTML: ["Add to Blacklist", "Remove from Blacklist"][(isBlacklisted(data.custid) ? 1 : 0)],
            className: "driver_popup"
        }));
        blacklistlink.id = "blink_" + data.custid;

        blacklistlink.onclick = blacklistMember(data.custid);

        if (isBlacklisted(data.custid)) {
            blacklistlink.onclick = whitelistMember(data.custid);
        }

        blacklistlink.onmouseover = function (e) {
            this.className = "driver_popup_hover";
        };
        blacklistlink.onmouseout = function (e) {
            this.className = "driver_popup";
        };

        popup.onmouseout = function (e) {
            removePopupOnBody(this.parentNode, e);
        };
    } catch (err) {
        logToConsole("buildPopupHelmet caught err: " + err);
    }
    return popup;
}

function mashPopupHelmet(layernode, custid, callback) {
    try {
        if (custid != MemBean.custid) {
			
			//Add an id to the row of this helmet...
			$(layernode).closest("tr").attr("id", "row_" + custid);
		
            var offsets = getOffsets(layernode);

            var updateFriendWatch = function(data) {
                FriendsListing[this.custid] = this.friend;
                WatchedListing[this.custid] = this.watch;

                try {
                    var f_idx = FriendsPickList.objIndexOf(this.custid, "id");
                    var w_idx = WatchedPickList.objIndexOf(this.custid, "id");
                    if (this.friend == 1) {
                        if (f_idx == -1) {
                            FriendsPickList.push({
                                name: this.displayName,
                                lowername: this.displayName.toLowerCase(),
                                id: this.custid
                            });
                        }
                    } else {
                        FriendsPickList.splice(f_idx, 1);
                    }
                    if (this.watch) {
                        if (w_idx == -1) {
                            WatchedPickList.push({
                                name: this.displayName,
                                lowername: this.displayName.toLowerCase(),
                                id: this.custid
                            });
                        }
                    } else {
                        WatchedPickList.splice(w_idx, 1);
                    }
                    FriendsPickList.sort(sortByProp("lowername"));
                    WatchedPickList.sort(sortByProp("lowername"));
                } catch (err) {
                    //
                }

                if (callback) {
                    callback(data);
                }

            };

            var idx = helmet_popup_arr.objIndexOf(custid, "custid");
            if (idx != -1) {
                var data = helmet_popup_arr[idx];
                data.modify = updateFriendWatch;
                hsBuildPopupOnBody(data, layernode, buildPopupHelmet, offsets.left + 24, offsets.top - 100)();
            }
        }
    } catch (err) {
        logToConsole("mashPopupHelmet caught err: " + err);
    }
}

function mashSecPopupHelmet(custid, subsessionid) {
    return function () {
        var layernode = this;
        var offsets = getOffsets(layernode);
        if (subsession_drivers[subsessionid]) {
            var idx = subsession_drivers[subsessionid].objIndexOf(custid, "custid");
            if (idx != -1) {
                data = subsession_drivers[subsessionid][idx];
                buildSecPopupOnBody(data, layernode, buildPopupHelmet, offsets.left + 24, offsets.top - 100)();
            }
        }
    };
}

function hsBuildPopupOnBody(data, layernode, func, left, top) {
    return function () {
        var appendnode = document.body;
        if (popuptimer)
            clearTimeout(popuptimer);
        popuptimerover = setTimeout(function () {
            if (activepopup.popup) {
                if (activepopup.popup == layernode) {
                    return;
                } else {
                    appendnode.removeChild(activepopup.popup);
                    activepopup.popup = null;
                    activepopup.layernode = null;
                }
            }

            appendnode.appendChild(activepopup.popup = func(data, left, top));
            activepopup.popup.onmouseover = function () {
                if (popuptimer)
                    clearTimeout(popuptimer);
            };
            activepopup.layernode = layernode;
        }, 200);
    };
}

function removePopupOnBody(layernode, e) {
    var toElement = window.event ? window.event.toElement : e.relatedTarget;
    if (popuptimerover)
        clearTimeout(popuptimerover);
    popuptimer = setTimeout(function () {
        if (activepopup && activepopup.popup && secactivepopup && toElement != secactivepopup.popup) {
            document.body.removeChild(activepopup.popup);
            activepopup.popup = null;
            activepopup.layernode = null;
            if (secactivepopup.popup) {
                document.body.removeChild(secactivepopup.popup);
                secactivepopup.popup = null;
                secactivepopup.layernode = null;
            }
        }
    }, 200);
}

function buildSecPopupOnBody(data, layernode, func, left, top) {
    return function () {
        var appendnode = document.body;
        if (secpopuptimer)
            clearTimeout(secpopuptimer);
        secpopuptimerover = setTimeout(function () {
            if (secactivepopup.popup) {
                if (secactivepopup.popup == layernode) {
                    return;
                } else {
                    appendnode.removeChild(secactivepopup.popup);
                    secactivepopup.popup = null;
                    secactivepopup.layernode = null;
                }
            }
            appendnode.appendChild(secactivepopup.popup = func(data, left, top));
            secactivepopup.popup.onmouseover = function () {
                if (secpopuptimer)
                    clearTimeout(secpopuptimer);
            };
            secactivepopup.popup.onmouseout = function (event) {
                removeSecPopupOnBody(this.parentNode, event);
            };

            secactivepopup.layernode = layernode;
        }, 200);
    };
}

function removeSecPopupOnBody(layernode, e) {
    var toElement = window.event ? window.event.toElement : e.relatedTarget;
    if (secpopuptimerover)
        clearTimeout(secpopuptimerover);
    secpopuptimer = setTimeout(function () {
        if (secactivepopup.popup && activepopup.popup) {
            document.body.removeChild(secactivepopup.popup);
            secactivepopup.popup = null;
            secactivepopup.layernode = null;
            var temp;
            if (toElement) {
                temp = toElement;
                var child = 0;
                do {
                    if (activepopup && temp == activepopup.popup)
                        child = 1;
                } while (temp == temp.parentNode);
                if (!child) {
                    document.body.removeChild(activepopup.popup);
                    activepopup.popup = null;
                    activepopup.layernode = null;
                }
            }
        }
    }, 200);
}

function buildPopupAllDrivers(data, left, top) {
    var alldrivers = subsession_drivers[data.subsessionid];
    var numrecords = 16;
    var allDriversPopup = {
        start: 1,
        end: (alldrivers.length < numrecords) ? alldrivers.length : 16,
        numrecords: numrecords,
        length: alldrivers.length
    };

    function getPrevStats() {
        var start = Math.max(allDriversPopup.start - allDriversPopup.numrecords, 1);
        var end = start + allDriversPopup.numrecords - 1;
        allDriversPopup.end = end;
        allDriversPopup.start = start;
        buildAllDriversPage();
        build_prevnext();
    }

    function getNextStats() {
        var start = allDriversPopup.end + 1;
        var end;
        var length = allDriversPopup.length;
        var numrecords = allDriversPopup.numrecords;
        if (start > length) {
            start = allDriversPopup.start;
            end = length;
        } else {
            if (start + (numrecords - 1) > length)
                end = length;
            else
                end = start + numrecords - 1;
        }
        allDriversPopup.end = end;
        allDriversPopup.start = start;
        buildAllDriversPage();
        build_prevnext();
    }

    function build_prevnext() {
        if (allDriversPopup.start > 1) {
            uparrow.style.backgroundPosition = "-16px 0px";
            uparrow.onclick = getPrevStats;
        } else {
            uparrow.style.backgroundPosition = "0px 0px";
            uparrow.onclick = null;
        }
        if (allDriversPopup.start + allDriversPopup.numrecords <= allDriversPopup.length) {
            downarrow.style.backgroundPosition = "-16px -14px";
            downarrow.onclick = getNextStats;
        } else {
            downarrow.style.backgroundPosition = "0px -14px";
            downarrow.onclick = null;
        }
    }

    function buildAllDriversPage() {
        table.replaceChild(element("tbody"), table.childNodes[0]);
        tbody = table.childNodes[0];
        tr = tbody.appendChild(element("tr", {}, {
            background: "#eeeeee"
        }));
        tr.appendChild(element("th", {
            innerHTML: "#"
        }, {
            width: "25px"
        }));
        tr.appendChild(element("th", {
            innerHTML: "Driver"
        }, {
            width: "123px"
        }));
        tr.appendChild(element("th", {
            innerHTML: "Car"
        }, {
            width: "50px"
        }));
        
        var removeSecPopupOnBodyEvent = function(event) {
                removeSecPopupOnBody(this, event);
        };
        
        for (var i = allDriversPopup.start; i <= allDriversPopup.end; i++) {
            var each = alldrivers[i - 1];
            if ((i % 2) == 1)
                tr_class = "back_dcdcdc";
            else
                tr_class = "";
            each.tr_old = tr_class;
            if (each.friend == 1 && each.watch) {
                tr_class = "stats_friendwatched_tr";
            } else if (each.friend == 1) {
                tr_class = "stats_friend_tr";
            } else if (each.watch) {
                tr_class = "stats_watched_tr";
            }
            tr = tbody.appendChild(element("tr", {
                className: tr_class
            }));
            each.tr = tr;
            tr.appendChild(element("td", {
                innerHTML: i
            }));
            td = tr.appendChild(element("td", {}, {
                textAlign: "left",
                borderRight: "none"
            }));
            var cust_div = td.appendChild(element("div", {
                className: "positionrelative"
            }, {
                paddingLeft: "4px"
            }));
            var helmet = cust_div.appendChild(element("div", {
                className: "eachdriver_helmet"
            }, {
                padding: "1px 0px"
            }));
            imgpreload(each.helmetsrc, helmet, "eachdriver_helmet");
            helmet.onmouseover = mashSecPopupHelmet(each.custid, data.subsessionid);
            helmet.onmouseout = removeSecPopupOnBodyEvent;
            var displayname_full = decodeURIComponent(each.displayName);
            var displayname = abbrevName(displayname_full);
            var display_div = cust_div.appendChild(element("div", {}, {
                position: "absolute",
                left: "28px",
                top: "4px",
                width: "91px",
                overflow: "hidden",
                whiteSpace: "nowrap"
            }));
            display_div.appendChild(element("a", {
                innerHTML: displayname,
                title: displayname_full,
                href: contextpath + "/member/CareerStats.do?custid=" + each.custid,
                className: "stats_table_link"
            }));
            td = tr.appendChild(element("td", {}));
            var carName = "n/a";
            var carTip = "";
            var car = getCarById(each.carid);
            if (car) {
                carName = car.abbrevname;
                carTip = car.name;
            }
            td.appendChild(element("div", {
                innerHTML: carName,
                title: carTip
            }, {
                paddingLeft: "3px",
                width: "44px",
                textAlign: "center",
                overflow: "hidden",
                whiteSpace: "nowrap"
            }));
        }
        tr = tbody.appendChild(element("tr", {}, {
            height: "15px",
            background: "#eeeeee"
        }));
        tr.appendChild(element("td", {
            colSpan: "3"
        }, {
            background: "#eeeeee"
        }));

        var popupclone = popup.cloneNode(true);
        document.body.appendChild(popupclone);
        var height = popupclone.offsetHeight;
        popup.style.top = top - Math.round(height / 2) + "px";
        popup.style.visibility = "visible";
        document.body.removeChild(popupclone);
        if (arrows)
            arrows.style.top = Math.round(height / 2) - 15 + "px";
    }

    var popup = element("div", {
        id: "results_alldrivers_popup"
    }, {
        zIndex: "3",
        position: "absolute",
        top: top + "px",
        left: left + "px",
        padding: "4px 24px 15px 24px",
        backgroundColor: "white",
        border: "1px solid black",
        textAlign: "left"
    });
    var table, tbody, tr, th;
    popup.appendChild(element("div", {
        innerHTML: "Total Drivers " + alldrivers.length
    }, {
        fontWeight: "bold",
        color: "#b40800",
        textAlign: "center",
        margin: "0px auto 4px",
        whiteSpace: "nowrap"
    }));
    table = popup.appendChild(element("table", {
        cellSpacing: "0",
        cellPadding: "0",
        className: "replays_alldrivers_table"
    }));
    table.appendChild(element("tbody"));
    var arrows = popup.appendChild(element("div", {}, {
        zIndex: "5",
        position: "absolute",
        top: "0px",
        right: "4px",
        width: "16px",
        height: "28px"
    }));
    var uparrow = arrows.appendChild(element("div", {}, {
        position: "absolute",
        top: "0px",
        left: "0px",
        background: "url(" + imageserver + "/member_images/replays/arrows_driverlist_updown.gif') no-repeat 0px 0px",
        width: "16px",
        height: "14px"
    }));
    var downarrow = arrows.appendChild(element("div", {}, {
        position: "absolute",
        top: "14px",
        left: "0px",
        background: "url(" + imageserver + "/member_images/replays/arrows_driverlist_updown.gif') no-repeat 0px -14px",
        width: "16px",
        height: "14px"
    }));
    build_prevnext();
    buildAllDriversPage();
    popup.onmouseout = function (e) {
        removePopupOnBody(this.parentNode, e);
    };
    return popup;
}

var subsession_drivers = {};

function mashPopupAllDrivers_handler(req, dataobj) {

    return function () {
        if (req.readyState == 4) {
            if (req.status == 200) {
                eval("ajax_alldrivers=" + req.responseText.replace(/\+/g, " ") + ";");
                if (ajax_alldrivers && ajax_alldrivers.length) {
                    var subsessionid = ajax_alldrivers[0].subsessionid;

                    var updateFriendWatch = function() {
                        if (this.friend == 1 && this.watch)
                            this.tr.className = "stats_friendwatched_tr";
                        else if (this.friend == 1)
                            this.tr.className = "stats_friend_tr";
                        else if (this.watch)
                            this.tr.className = "stats_watched_tr";
                        else if (this.tr.rowIndex % 2 === 0)
                            this.tr.className = "back_dcdcdc";
                        else
                            this.tr.className = "";

                        FriendsListing[this.custid] = this.friend;
                        WatchedListing[this.custid] = this.watch;

                        try {
                            var f_idx = FriendsPickList.objIndexOf(this.custid, "id");
                            var w_idx = WatchedPickList.objIndexOf(this.custid, "id");
                            if (this.friend == 1) {
                                if (f_idx == -1) {
                                    FriendsPickList.push({
                                        name: this.displayName,
                                        lowername: this.displayName.toLowerCase(),
                                        id: this.custid
                                    });
                                }
                            } else {
                                FriendsPickList.splice(f_idx, 1);
                            }
                            if (this.watch) {
                                if (w_idx == -1) {
                                    WatchedPickList.push({
                                        name: this.displayName,
                                        lowername: this.displayName.toLowerCase(),
                                        id: this.custid
                                    });
                                }
                            } else {
                                WatchedPickList.splice(w_idx, 1);
                            }
                            FriendsPickList.sort(sortByProp("lowername"));
                            WatchedPickList.sort(sortByProp("lowername"));
                        } catch (err) {
                            //
                        }
                    };

                    if (!subsession_drivers[subsessionid]) {
                        subsession_drivers[subsessionid] = [];
                        for (var i = 0; i < ajax_alldrivers.length; i++) {
                            var each = ajax_alldrivers[i];
                            var data = {};
                            data.custid = each.custid;
                            data.carid = each.carid;
                            data.displayName = decodeURIComponent(each.displayname);
                            data.friend = FriendsListing[each.custid] ? FriendsListing[each.custid] : 0;
                            data.watch = WatchedListing[each.custid] ? 1 : 0;
                            var helmetsrc;
                            if (systemversions) {
                                helmetsrc = localserver + "/helmet.png?size=5&pat=" + each.helmpattern + "&lic=" + each.maxlicenselevel + "&colors=" + each.helmcolor1 + "," + each.helmcolor2 + "," + each.helmcolor3;
                            } else {
                                helmetsrc = contextpath + "/images/default/helmet/size_0/helmet.bmp";
                            }
                            data.helmetsrc = helmetsrc;
                            data.modify = updateFriendWatch;
                            subsession_drivers[each.subsessionid].push(data);
                        }
                    }
                    buildPopupOnBody({
                        subsessionid: subsessionid
                    }, dataobj.layernode, buildPopupAllDrivers, dataobj.left, dataobj.top)();
                }
            }
        }
    };
}

function mashPopupAllDrivers(layernode, subsessionid) {
    var offsets = getOffsets(layernode);
    if (!subsession_drivers[subsessionid]) {
        load(contextpath + "/member/GetCustDisplayInfo?subsessionid=" + subsessionid, {}, mashPopupAllDrivers_handler, {
            layernode: layernode,
            left: offsets.left - 252,
            top: offsets.top
        });
    } else {
        buildPopupOnBody({
            subsessionid: subsessionid
        }, layernode, buildPopupAllDrivers, offsets.left - 252, offsets.top)();
    }
}

/*
 Blacklist services
 */
function callBlackListService(parameters, callback) {
    //console.log("About to make AJAX call to BlacklistService...");
    //console.log(parameters);

    load(contextpath + "/member/BlacklistService", parameters, function leagueMemberHandler(req) {
        return function () {
            if (req.readyState == 4) {
                if (req.status == 200) {
                    var callbackData = extractJSON(req.responseText);
                    if (callbackData) {
                        decodeAllFields(callbackData);
                    }

                    callback(callbackData);
                }
            }
        };
    });
}

function fillListWithMembers(memberData, memberList) {
    var member;
    var theMemberId;

    //Add all blacklisted members in an array and marked them "true".
    //This is simply used for lookup and functions as a "contains" function.
    /*
    console.log("memberData.length = " + memberData.length);
    console.log("memberData = ");
    console.log(memberData);

    console.log("memberList = ");
    console.log(memberList);
	*/
    for (var x = 0; x < memberData.length; x++) {
        member = memberData[x];
        memberList.push(member.memberId);
    }
}

function fetchBlacklist() {
    var parms = {};
    parms.command = "getBlacklist";

    callBlackListService(parms, function (resultData) {
        fillListWithMembers(resultData, _blacklisted_members);
        //console.log(_blacklisted_members);
    });
}

function fetchBlacklisters() {
    var parms = {};
    parms.command = "getBlacklisters";

    callBlackListService(parms, function (resultData) {
        fillListWithMembers(resultData, _blacklisters);
    });
}

function toggleBlacklist(memberId, isBlacklisted) {
    var parms = {};
    parms.custId = memberId;
    parms.command = (isBlacklisted ? "removeFromBlacklist" : "addToBlacklist");

    callBlackListService(parms, function (resultData) {
        var theRow = null;
        var theLink = null;
        var idPos = -1;

        //console.log(resultData.message);
        theRow = el("row_" + resultData.custId);
        theLink = el("blink_" + resultData.custId);
        idPos = _blacklisted_members.indexOf(resultData.custId);

        if (resultData.message == "removed") {
            theRow.style.background = theRow.rowBG_orig;
            theRow.data.isBlacklisted = false;
            theLink.onclick = blacklistMember(resultData.custId);
            theLink.innerHTML = "Add to Blacklist";
            if (idPos > -1) {
                _blacklisted_members[idPos] = "EMPTY";
            }
        } else {
            if (idPos == -1) {
                idPos = _blacklisted_members.indexOf("EMPTY");

                if (idPos == -1) {
                    _blacklisted_members.push(resultData.custId);
                } else {
                    _blacklisted_members[idPos] = resultData.custId;
                }
            }
            theRow.style.background = _LIGHT_RED_;
            theRow.data.isBlacklisted = true;
            theLink.onclick = whitelistMember(resultData.custid);
            theLink.innerHTML = "Remove from Blacklist";
        }
    });
}

function blacklistMember(memberId) {
    return function () {
        toggleBlacklist(memberId, false);
    };
}

function whitelistMember(memberId) {
    return function () {
        toggleBlacklist(memberId, true);
    };
}

function isBlacklister(custId) {
    var result = false;
    result = (_blacklisters.indexOf(custId) != -1 ? true : false);
    return result;
}

function isBlacklisted(custId) {
    var result = false;
    result = (_blacklisted_members.indexOf(custId) != -1 ? true : false);
    return result;
}

function formatTime(t) {
    var h = Math.floor(t / 3600.0);
    t = t - h * 3600.0;
    var m = Math.floor(t / 60.0);
    t = t - m * 60.0;
    var s = Math.round(t);
    if (h < 10)
        h = "0" + h;
    if (m < 10)
        m = "0" + m;
    if (s < 10)
        s = "0" + s;
    return h + ":" + m + ":" + s;
}