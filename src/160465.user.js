// ==UserScript==
// @name NicoDicBBSViewer
// @description ニコニコ大百科のBBSの拡張
// @namespace http://threeaster.net
// @include http://dic.nicovideo.jp/a/*
// @include http://dic.nicovideo.jp/b/*
// @include http://dic.nicovideo.jp/l/*
// @include http://dic.nicovideo.jp/v/*
// @include http://dic.nicovideo.jp/i/*
// @include http://dic.nicovideo.jp/u/*
// @require http://ajax.googleapis.com/ajax/libs/jquery/1.8.3/jquery.min.js
// @grant GM_getValue
// @grant GM_setValue
// @version 0.0.1.20140609045517
// ==/UserScript==
$.noConflict();
var net_threeaster_NicoDicBBSViewer = {};
(function($){
	//-----UrlAnalyzer-----
	function UrlAnalyzer(){};
	UrlAnalyzer.prototype.getNowUrl = function(){
		return document.URL;
	};
	UrlAnalyzer.prototype.inArticlePage = function(){
		return this.getNowUrl().indexOf("http://dic.nicovideo.jp/b/") === -1;
	};
	UrlAnalyzer.prototype.getBBSURLs = function(pager){
		var urls = pager.find("a").not(".navi").map(function(){return this.href}).get();
		var bbsURLs = [];
		if(urls.length){
			var lastURLParts = urls[urls.length - 1].split("/");
			var lastNumber = lastURLParts[lastURLParts.length - 1].replace("-", "");
			if(!this.inArticlePage()){
				var nowURLParts = this.getNowUrl().split("#")[0].split("/");
				var nowNumber = nowURLParts[nowURLParts.length - 1].replace("-", "");
				lastNumber = (lastNumber - 0 >= nowNumber - 0) ? lastNumber : nowNumber;
			}
			lastURLParts.pop();
			var basicURL = lastURLParts.join("/") + "/";
			for(var i = lastNumber; i > 0; i -= 30){
				bbsURLs.unshift(basicURL + i + "-");
			}
		}else{
			var url = this.getNowUrl();
			if(url.indexOf("#") !== -1){
				url = url.substring(0, url.indexOf("#"));
				if(url.indexOf("-") === -1){
					url = url + "-";
				}
			}
			bbsURLs.push(url);
		}
		return bbsURLs;
	};

	//-----ResList-----
	function ResList(){}
	ResList.prototype.createRes =  function(dl){
		dl.find("dt").each(function(){
			var self = $(this);
			self.attr("data-number", self.find("a").eq(0).attr("name"));
			self.attr("data-name", self.find("span").text());
			var id = self.text().split(":");
			id = id[id.length - 1].split("[");
			id = id[0];
			self.attr("data-id", $.trim(id));
		});
		var resheads = dl.find("dt");
		var resbodies = dl.find("dd");
		this.resList = new Array(resheads.size());
		for(var i = 0; i < resheads.size(); i++){
			this.resList[i] = new Res(resheads.eq(i), resbodies.eq(i));
		}
	};
	ResList.prototype.createResListById = function(){
		this.resListById = {};
		for(var i = 0; i < this.resList.length; i++){
			if(!this.resListById[$(this.resList[i].reshead).attr("data-id")]){
				this.resListById[$(this.resList[i].reshead).attr("data-id")] = [];
			}
			this.resListById[$(this.resList[i].reshead).attr("data-id")].push(this.resList[i]);
		}
	};

	//-----BbsInitializer-----
	/*
	function BbsInitializer(){}
	BbsInitializer.prototype.
	*/

	var removeUselessLines = function(s){
		if(!s){
			return;
		}
		var lines = s.split("\n");
		var storage = {};
		for(var i = 0; i < lines.length;){
			if(!lines[i] || lines[i] in storage){
				lines.splice(i, 1);	
			}else{
				storage[lines[i]] = 0;
				i++;
			}
		}
		return lines.join("\n");
	};


	var setContextMenu = function(a){
		var dl = a ? a : $("#bbsmain");
		dl.find(".ID, .IDMulti, .IDMany").unbind("click").click(function(e){
			$(this).parent(".reshead").append($("#contextMenu").css({left : e.pageX, top : e.pageY}).show());
			e.stopPropagation();
		});
		$("html").unbind("click").click(function(){
			$("#contextMenu").hide();
		});
	};

	function Res(reshead, resbody){
		this.reshead = reshead;
		/*
			var a = this.reshead.find("a").eq(0);
			//a.attr("id", "r" + a.attr("name")).attr("href", "#" + a.attr("id"));
		if(GM_getValue("loadAll") && document.URL.indexOf("http://dic.nicovideo.jp/b/") !== -1){
			a.html(a.attr("name"));
			var t = reshead.html();
			var before = t.substring(0, t.indexOf("</a>"));
			var after = t.substring(t.indexOf("</a>")).replace(a.attr("name"), "");
			reshead.html(before + after);
		}
		*/
		this.resbody = resbody;
	};

	Res.prototype.backupRes = function(){
		this.trueReshead = this.reshead.clone(true);
		this.trueResbody = this.resbody.clone(true);
	}

	var makeIDDiv = function(a){
		var dl = a ? a : $("#bbsmain");
		dl.find(".reshead").each(function(){
			var s = $(this).html().split(":");
			s[s.length - 2] = s[s.length - 2].replace("ID", "<div class='ID'>ID</div>");
			$(this).html(s.join(":"));
		});
	};

	Res.prototype.makeIDDivReflectingSameID = function(resListById){
		var addOrdinalAndTotal = function(res, sameIDRes){
			if(GM_getValue("classificationID")){
				return "[" + (sameIDRes.indexOf(res) + 1) + "/" + sameIDRes.length + "]"
			}else{
				return "";
			}
		}
		var sameIDRes = resListById[this.reshead.attr("data-id")];
		if(GM_getValue("classificationID")){
			var addIDMulti = "IDMulti";
			var addIDMany = "IDMany";
		}else{
			var addIDMulti = "ID";
			var addIDMany = "ID";
		}
		if(this.reshead.find(".ID, .IDMulti, .IDMany").size() === 0){
			var s = this.reshead.html().split(":");
			if(sameIDRes.length == 1){
				s[s.length - 2] = s[s.length - 2].replace("ID", "<div class='ID'>ID</div>");
			}else if(sameIDRes.length < 5){
				s[s.length - 2] = s[s.length - 2].replace("ID", "<div class='" + addIDMulti + "'>ID</div>");
				s[s.length - 1] += addOrdinalAndTotal(this, sameIDRes);
			}else{
				s[s.length - 2] = s[s.length - 2].replace("ID", "<div class='" + addIDMany + "'>ID</div>");
				s[s.length - 1] += addOrdinalAndTotal(this, sameIDRes);
			}
			this.reshead.html(s.join(":"));
		}else if(this.reshead.find(".ID").size() !== 0){
			if(sameIDRes.length == 1){
			}else if(sameIDRes.length < 5){
				this.reshead.find(".ID, .IDMulti, .IDMany").removeClass("ID IDMulti IDMany").addClass(addIDMulti);
				var s = this.reshead.html().split(":");
				s[s.length - 1] += addOrdinalAndTotal(this, sameIDRes);
				this.reshead.html(s.join(":"));
			}else{
				this.reshead.find(".ID, .IDMulti, .IDMany").removeClass("ID IDMulti IDMany").addClass(addIDMany);
				var s = this.reshead.html().split(":");
				s[s.length - 1] += addOrdinalAndTotal(this, sameIDRes);
				this.reshead.html(s.join(":"));
			}
		}else{
			if(sameIDRes.length < 5){
				this.reshead.find(".ID, .IDMulti, .IDMany").removeClass("ID IDMulti IDMany").addClass(addIDMulti);
				var s = this.reshead.html().split("[");
				s[s.length - 1] = addOrdinalAndTotal(this, sameIDRes);
				this.reshead.html(s.join(""));
			}else{
				this.reshead.find(".ID, .IDMulti, .IDMany").removeClass("ID IDMulti IDMany").addClass(addIDMany);
				var s = this.reshead.html().split("[");
				s[s.length - 1] = addOrdinalAndTotal(this, sameIDRes);
				this.reshead.html(s.join(""));
			}
		}
	}
	
	Res.prototype.makeNumberDiv = function(resList){
		this.linkedResponds = [];
		var myNumber = this.reshead.attr("data-number") - 0;
		for(var i = 0; i < resList.length; i++){
			var numberAnchorsWrapset = resList[i].resbody.find("a.dic");
			var numberAnchors = [];
			if(numberAnchorsWrapset.size() !== 0){
				numberAnchorsWrapset.each(function(){
					numberAnchors.push($(this).html().split("&gt;").join(""));
				});
			}else{
				continue;
			}
			for(var j = 0; j < numberAnchors.length; j++){
				var num = numberAnchors[j];
				if(num.indexOf("-") === -1 && myNumber == num){
					this.linkedResponds.push(resList[i]);
					break;
				}else if(num.indexOf("-") !== -1){
					num = num.split("-");
					if(num[0] <= myNumber && myNumber <= num[1]){
						this.linkedResponds.push(resList[i]);
						break;
					}
				}
			}
		}
		this.reshead.find("div.Number, div.NumberMulti, div.NumberMany").contents().unwrap();
		if(this.linkedResponds.length === 0){
		}else if(!GM_getValue("classificationResNumber") || this.linkedResponds.length === 1){
			this.reshead.html(this.reshead.html().replace(/a>([0-9]+)/, "a><div class='Number'>$1</div>"));
		}else if(this.linkedResponds.length <= 3){
			this.reshead.html(this.reshead.html().replace(/a>([0-9]+)/, "a><div class='NumberMulti'>$1</div>"));
		}else{
			this.reshead.html(this.reshead.html().replace(/a>([0-9]+)/, "a><div class='NumberMany'>$1</div>"));
		}
		console.log(this.reshead.html());
	}


	Res.prototype.makeIDTooltip = function(){
		var sameIDRes = responds.resListById[this.reshead.attr("data-id")];
		var divID = this.reshead.find("div[class^='ID']");
		divID.unbind("mouseenter").unbind("mouseleave").hover(function(){
			var tooltip = $("<div></div>").click(function(e){e.stopPropagation();});
			for(var i = 0; i < sameIDRes.length; i++){
				tooltip.append(sameIDRes[i].reshead.clone().find("a").removeAttr("id").end());
				tooltip.append(sameIDRes[i].resbody.clone().find("a").removeAttr("id").end());
			}
			divID.append(tooltip);
			divID.focus();
			controlTooltip(tooltip);
			tooltip.scroll(tooltip.find(".iframe"), function(e){
				e.data.each(recover);
			});
			tooltip.find(".iframe").each(recover);
		}, function(){
			divID.find("div").remove();
		});
	};

	Res.prototype.makeNumTooltip = function(){
		this.resbody.find("a.dic").filter(function(){return $(this).html().indexOf("&gt;&gt;") !== -1}).each(function(){
			var self = $(this);
			var num = self.html().split("&gt;").join("").split("-");
			//self.attr("href", "#r" + num[0]);
			self.attr("href", "#" + num[0]);
			self.removeAttr("target");
			self.wrap("<span class='numTooltip'></span>").parent().unbind("mouseenter").unbind("mouseleave").hover(function(){
				var self = $(this);
				var tooltip = $("<div></div>");
				if(num.length == 1 || !num[1]){
					tooltip.append(getResByNumber(num[0]).reshead.clone().find("a").removeAttr("id").end());
					tooltip.append(getResByNumber(num[0]).resbody.clone().find("a").removeAttr("id").end());
				}else{
					for(var i = num[0]; i <= num[1]; i++){
						tooltip.append(getResByNumber(i).reshead.clone().find("a").removeAttr("id").end());
						tooltip.append(getResByNumber(i).resbody.clone().find("a").removeAttr("id").end());
					}
				}
				self.append(tooltip);
				self.focus();
				controlTooltip(tooltip);
				tooltip.scroll(tooltip.find(".iframe"), function(e){
					e.data.each(recover);
				});
				tooltip.find(".iframe").each(recover);
			}, function(){
				$(this).find("div").remove();
			});
		});
	};
	
	Res.prototype.makeLinkedNumberTooltip = function(){
		var divNumber = this.reshead.find("div[class^='Number']");
		var linkedResponds = this.linkedResponds;
		divNumber.unbind("mouseenter").unbind("mouseleave").hover(function(){
			var tooltip = $("<div></div>").click(function(e){e.stopPropagation();});
			for(var i = 0; i < linkedResponds.length; i++){
				tooltip.append(linkedResponds[i].reshead.clone().find("a").removeAttr("id").end());
				tooltip.append(linkedResponds[i].resbody.clone().find("a").removeAttr("id").end());
			}
			divNumber.append(tooltip);
			divNumber.focus();
			controlTooltip(tooltip);
			tooltip.scroll(tooltip.find(".iframe"), function(e){
				e.data.each(recover);
			});
			tooltip.find(".iframe").each(recover);
		}, function(){
			divNumber.find("div").remove();
		});
	}
	
	Res.prototype.makeNumberHandleTooltip = function(){
		var nameSpan = this.reshead.find(".name");
		var name = nameSpan.html();
		var transformedName = name.replace(/[０１２３４５６７８９]/g, function(c){return "０１２３４５６７８９".indexOf(c);});
		if(/^[0-9]+$/.test(transformedName)){
			nameSpan.wrap("<span class='NumberHandle'></span>").parent().unbind("mouseenter").unbind("mouseleave").hover(function(){
				var self = $(this);
				var tooltip = $("<div></div>");
				tooltip.append(getResByNumber(transformedName).reshead.clone().find("a").removeAttr("id").end());
				tooltip.append(getResByNumber(transformedName).resbody.clone().find("a").removeAttr("id").end());
				self.append(tooltip);
				self.focus();
				controlTooltip(tooltip);
				tooltip.scroll(tooltip.find(".iframe"), function(e){
					e.data.each(recover);
				});
				tooltip.find(".iframe").each(recover);
			}, function(){
				$(this).find("div").remove();
			});
		}
	}
	
	var getResByNumber = function(number){
		for(var i = 0; i < responds.res.length; i++){
			if(responds.res[i].reshead.attr("data-number") == number){
				return responds.res[i];
			}
		}
	};

	var controlTooltip = function(tooltip){
		var a = $("html").scrollTop() + $("#topline").height();
		var b = tooltip.offset().top;
		var c = $(window).height() - $("#topline").height();
		var d = tooltip.height();
		if(a < b && b < a + c && a < b + d && b + d < a + c){
		}else if(d < c){
			if(b > a){
				tooltip.offset({top : (a + c - d) });
			}else{
				tooltip.offset({top : a});
			}
		}else{
			tooltip.offset({top : a});
			tooltip.height(c - $("#topline").height());
		}
	};

	var getOtherBBS = function(urls){
		var index = 0;
		parent.find("dl").eq(0).append("<p style='text-align:center'>now loading...<br/>全てのレスを読み込んでいます。レス数によっては、あるいはサーバーの調子によっては数分間かかることもあります。</p>");
		var dl = $("<dl></dl>");
		function getURL(url){
			$.get(url, function(r){
				dl.append($(r).find("#bbs").find("dl").unwrap());
				index++;
				if(index < urls.length){
					getURL(urls[index]);
				}else{
					parent.find("dl").eq(0).empty();
					delayiframe(dl);
					createRes(dl);
					createResListById();
					makeTooltips();
					showres(responds.res);
					setContextMenu();
					bindMenu();
					for(var i = 0; i < responds.res.length; i++){
						responds.res[i].backupRes();
					}
					applyNG();
				}
			});
		};
		getURL(urls[0]);
	};

	var delayiframe = function(dl){
		dl.find("iframe").wrap("<div class='iframe'>");
		dl.find(".iframe").each(function(){
			$(this).html("<!--" + $(this).html() + "-->");
		});
		$(window).bind("scroll.iframe", dl.find(".iframe"), function(e){
			e.data.each(recover);
		});
	}

	var makeTooltips = function(){
		for(var i = 0; i < responds.res.length; i++){
			responds.res[i].makeIDDivReflectingSameID();
			responds.res[i].makeNumberDiv();
			if(GM_getValue("showIDTooltip")){
				responds.res[i].makeIDTooltip();
			}
			if(GM_getValue("showResAnchorTooltip")){
				responds.res[i].makeNumTooltip();
			}
			if(GM_getValue("showResNumberTooltip")){
				responds.res[i].makeLinkedNumberTooltip();
			}
			if(GM_getValue("showResHandleTooltip")){
				responds.res[i].makeNumberHandleTooltip();
			}
		}
	};

	var bindMenu = function(){
		$("#ngidMenu").click(function(){
			$("#contextMenu").hide();
			if($(this).parents(".reshead").hasClass(".deleted")){
				return false;
			}
			var id = $(this).parents(".reshead").attr("data-id");
			var ngidText = GM_getValue("ngid") + "\n" + id;
			ngidText = removeUselessLines(ngidText);
			$("#ngidTextarea").val(ngidText);
			GM_setValue("ngid", ngidText);
			initNG();
			applyNG();
		});

		$("#ngnameMenu").click(function(){
			$("#contextMenu").hide();
			if($(this).parents(".reshead").hasClass(".deleted")){
				return false;
			}
			var name = $(this).parents(".reshead").attr("data-name");
			var ngnameText = GM_getValue("ngname") + "\n" + name;
			ngnameText = removeUselessLines(ngnameText);
			$("#ngnameTextarea").val(ngnameText);
			GM_setValue("ngname", ngnameText);
			initNG();
			applyNG();
		});

		$("#ngresMenu").click(function(){
			$("#contextMenu").hide();
			if($(this).parents(".reshead").hasClass(".deleted")){
				return false;
			}
			var number = $(this).parents(".reshead").attr("data-number");
			var URL = document.URL.split("/");
			URL.pop();
			URL = URL.join("/");
			var ngresText = GM_getValue("ngres") + "\n" + URL + ":" + number;
			ngresText = removeUselessLines(ngresText);
			$("#ngresTextarea").val(ngresText);
			GM_setValue("ngres", ngresText);
			initNG();
			applyNG();
		});
	};

	var recover = function(){
		var self = $(this);
		var tooltip = self.parents(".ID>div, .IDMulti>div, .IDMany>div, .numTooltip>div, .Number>div, .NumberMulti>div, .NumberMany>div");
		if(tooltip.size() === 0){
			var windowhi = $("html").scrollTop();
			var windowlow = $("html").scrollTop() + $(window).height();
		}else{
			var windowhi = tooltip.scrollTop();
			var windowlow = tooltip.scrollTop() + tooltip.height();
		}
		var iframehi = self.position().top;
		var iframelow = self.position().top + self.height();
		if(((windowhi < iframehi) && (iframehi < windowlow)) || ((windowhi < iframelow) && (iframelow < windowlow))){
			self.html(self.html().replace(/<!--|-->/g, ""));
			self.replaceWith(self.contents());
		}
	};

	var showres = function(responds){
		var dl = parent.find("dl");
		for(var i = 0; i < responds.length; i++){
			dl.append(responds[i].reshead);
			dl.append(responds[i].resbody);
		}
		dl.find(".iframe").each(recover);
	};

	var ajustSideMenu = function(){
		if($("html").scrollTop() < $("#bbs, #ng").offset().top){
			$("#sidemenu").css({position : "absolute", top : $("#bbs, #ng").offset().top + 100 + "px"});
		}else{
			$("#sidemenu").css({position : "fixed", top : "100px"});
		}
	};
	
	var getCheckbox = function(id){
		console.log(id);
		return '<input id="' + id + 'Checkbox" type="checkbox" ' + (GM_getValue(id) ? "checked = 'checked'" : "") + '/>';
	}

	var setMenu = function(){
		if(GM_getValue("switcherInTopMenu")){
			$("#topbarLogoutMenu").after('<li>NicoDicBBSViewer</li><li id="bbsLi" class="selected"><a href="#">掲示板を表示する</a></li><li id="ngLi"><a href="#">設定画面を表示する</a></li>');
		}else{
			$("body").prepend('<ul id="sidemenu" style="top:100px; float:left; position:fixed; list-style-type:none; padding:0px"><li id="bbsLi" class="selected">掲示板</li><li id="ngLi">設定</li></ul>');

		}
		$("#bbs").after('<div id="ng"><div style="float:left; width:24%"><p>改行で区切ってNGIDを入力or削除してください。</p><textarea id="ngidTextarea" cols="20" rows="10" placeholder="NGIDを改行で区切って入力してください。">' + (nglist.ngidText ? nglist.ngidText : "")  + '</textarea></div><div style="float:left; width:24%"><p>改行で区切ってNGNameを入力or削除してください。</p><textarea id="ngnameTextarea" cols="20" rows="10" placeholder="NGNameを改行で区切って入力してください。">' + (nglist.ngnameText ? nglist.ngnameText : "" ) + '</textarea></div><div style="float:left; width:24%"><p>改行で区切ってNGワードを入力or削除してください。</p><textarea id="ngwordTextarea" cols="20" rows="10" placeholder="NGワードを改行で区切って入力してください。">' + (nglist.ngwordText ? nglist.ngwordText : "")  + '</textarea></div><div style="float:left; width:24%"><p>改行で区切って(BBSのURL:レス番号)の書式でNGレスを入力or削除してください。</p><textarea id="ngresTextarea" cols="20" rows="10" placeholder="NGレスを(BBSのURL:レス番号)の書式で改行で区切って入力してください。">' + (nglist.ngresText ? nglist.ngresText : "") + '</textarea></div><div style="clear:left;"><form><ul style="list-style-type: none;"><li>' + getCheckbox("autoLoad") + '下までスクロールした時に次のページを読み込む</li><li>NG機能<ul style="list-style-type: none; margin-left:5px;"><li>' + getCheckbox("useNG") + 'NG機能を使用する</li><li>' + getCheckbox("seethroughNG") + 'NGが適用されたレスを表示しない</li></ul></li><li>' + getCheckbox("tooltipOnDicPage") +'記事ページでもID、番号の色分けやツールチップを表示する</li><li>ツールチップ(更新時有効)<ul style="list-style-type: none; margin-left:5px;"><li>' + getCheckbox("showIDTooltip") +'ID(<span style="text-decoration:underline;">ID</span>)ツールチップを表示する</li><li>' + getCheckbox("showResAnchorTooltip") +'レスアンカー(<span style="color: rgb(0, 102, 204);">>>1</span>)ツールチップを表示する</li><li>' + getCheckbox("showResNumberTooltip") + 'レス番(<span style="text-decoration:underline;">1</span>)ツールチップを表示する</li><li>' + getCheckbox("showResHandleTooltip") + 'レス番ハンドル(<span style="color: rgb(0, 136, 0); font-weight: bold;">1</span>)ツールチップを表示する</li></ul></li><li>色分け(更新時有効)<ul style="list-style-type: none; margin-left:5px;"><li>' + getCheckbox("classificationID") + 'IDを色分けし、そのIDのレスの回数を表示する</li><li>' + getCheckbox("classificationResNumber") +'参照されているレス番を色分けする</li></ul></li><ul><li>UI<ul><li>' + getCheckbox("switcherInTopMenu") + '掲示板/設定画面切り替えボタンを上のメニュー内に入れる(更新時有効)</li></ul></li></ul></ul></form><button id="decideNG">保存</button>　<button id="cancelNG">キャンセル</button>　<button id="backToBbsButton">掲示板に戻る</button></div></div> <ul id="contextMenu"><li id="ngidMenu">NGIDに追加</li><li id="ngnameMenu">NGNameに追加</li><li id="ngresMenu">このレスを削除</li></ul>');
		var contents = $("#bbs, #ng");
		$(window).scroll(ajustSideMenu);
		ajustSideMenu();
		var backBBS = function(){
			if($(".selected").attr("id") === "bbsLi"){
				bbsScroll = $("html").scrollTop();
			}
			$(".selected").removeClass("selected");
			$("#bbsLi").addClass("selected");
			contents.not("#bbs").css("display", "none");
			$("#bbs").css("display", "block");
			$("html").scrollTop(bbsScroll);
			return false;
		};
		$("#bbsLi").click(backBBS);
		$("#backToBbsButton").click(backBBS);

		$("#ngLi").click(function(){
			if($(".selected").attr("id") === "bbsLi"){
				bbsScroll = $("html").scrollTop();
			}
			$(".selected").removeClass("selected");
			$(this).addClass("selected");
			contents.not("#ngid").css("display", "none");
			$("#ng").css("display", "block");
			$("html").scrollTop($("#ng").offset().top - $("#topline").height());
			return false;
		});
		
		var setcbConfig = function(id){
			GM_setValue(id, $("#" + id + "Checkbox").is(":checked"));
		}
		
		var checkcbConfig = function(id){
			if(GM_getValue(id)){
				$("#" + id + "Checkbox").attr("checked", true);
			}else{
				$("#" + id + "Checkbox").attr("checked", false);
			}
		}

		$("#decideNG").click(function(){
			GM_setValue("ngid", $("#ngidTextarea").val());
			GM_setValue("ngname", $("#ngnameTextarea").val());
			GM_setValue("ngword", $("#ngwordTextarea").val());
			GM_setValue("ngres", $("#ngresTextarea").val());
			setcbConfig("seethroughNG");
			setcbConfig("loadAll");
			setcbConfig("autoLoad");
			setcbConfig("useNG");
			setcbConfig("tooltipOnDicPage");
			setcbConfig("showIDTooltip");
			setcbConfig("showResAnchorTooltip");
			setcbConfig("showResNumberTooltip");
			setcbConfig("showResHandleTooltip");
			setcbConfig("classificationID");
			setcbConfig("classificationResNumber");
			setcbConfig("switcherInTopMenu");
			initNG();
			applyNG();
		});
		
		$("#cancelNG").click(function(){
			$("#ngidTextarea").val(nglist.ngidText ? nglist.ngidText : "");
			$("#ngnameTextarea").val(nglist.ngnameText ? nglist.ngnameText : "");
			$("#ngwordTextarea").val(nglist.ngwordText ? nglist.ngwordText : "");
			$("#ngresTextarea").val(nglist.ngresText ? nglist.ngresText : "");
			checkcbConfig("seethroughNG");
			checkcbConfig("loadAll");
			checkcbConfig("autoLoad");
			checkcbConfig("useNG");
			checkcbConfig("tooltipOnDicPage");
			checkcbConfig("showIDTooltip");
			checkcbConfig("showResAnchorTooltip");
			checkcbConfig("showResNumberTooltip");
			checkcbConfig("showResHandleTooltip");
			checkcbConfig("classificationID");
			checkcbConfig("classificationResNumber");
			checkcbConfig("switcherInTopMenu");
		});
	};

	var initNG = function(){
		var nglist = {};
		nglist.ngidText = removeUselessLines(GM_getValue("ngid"));
		if(nglist.ngidText){
			nglist.ngid = nglist.ngidText.split("\n");
			for(var i = 0; i < nglist.ngid.length; i++){
				nglist.ngid[i] = $.trim(nglist.ngid[i]);
			}
		}else{
			nglist.ngid = [];
		}
		nglist.ngnameText = removeUselessLines(GM_getValue("ngname"));
		if(nglist.ngnameText){
			nglist.ngname = nglist.ngnameText.split("\n");
			for(var i = 0; i < nglist.ngname.length; i++){
				nglist.ngname[i] = $.trim(nglist.ngname[i]);
			}
		}else{
			nglist.ngname = [];
		}
		nglist.ngwordText = removeUselessLines(GM_getValue("ngword"));
		if(nglist.ngwordText){
			nglist.ngword = nglist.ngwordText.split("\n");
			for(var i = 0; i < nglist.ngword.length; i++){
				nglist.ngword[i] = $.trim(nglist.ngword[i]);
			}
		}else{
			nglist.ngword = [];
		}
		nglist.ngresText = removeUselessLines(GM_getValue("ngres"));
		if(nglist.ngresText){
			nglist.ngres = nglist.ngresText.split("\n");
			for(var i = 0; i < nglist.ngres.length; i++){
				nglist.ngres[i] = $.trim(nglist.ngres[i]);
			}
		}else{
			nglist.ngres = [];
		}
		return nglist;
	};

	var applyNG = function(){
		for(var i = 0; i < responds.res.length; i++){
			var r = responds.res[i];
			var applied = false;
			if(GM_getValue("useNG")){
				var id = r.trueReshead.attr("data-id");
				var name = r.trueReshead.attr("data-name");
				for(var j = 0; !applied && j < nglist.ngid.length; j++){
					if(nglist.ngid[j] === id){
						applied = true;
					}
				}
				for(var j = 0; !applied && j < nglist.ngname.length; j++){
					if(name.indexOf(nglist.ngname[j]) !== -1){
						applied = true;
					}
				}
				for(var j = 0; !applied && j < nglist.ngword.length; j++){
					if(r.trueResbody.text().indexOf(nglist.ngword[j]) !== -1){
						applied = true;
					}
				}
				for(var j = 0; !applied && j < nglist.ngres.length; j++){
					var ngres = nglist.ngres[j].split(":");
					var number = ngres.pop();
					var URL = ngres.join(":");
					if(document.URL.indexOf(URL) !== -1 && r.reshead.attr("data-number") == number){
						applied = true;
					}
				}
			}
			if(applied){
				$("#contextMenu").insertAfter("#ng");
				r.reshead.find(".name").html("削除しました");
				r.reshead.find(".trip").remove();
				r.reshead.addClass("deleted");
				r.resbody.html("削除しました").addClass("deleted");
			}else if(r.reshead.hasClass("deleted")){
				r.reshead.removeClass("deleted").find(".name").html(r.trueReshead.attr("data-name"));//ここで.nameと.tripが一緒になる。.tripを個別に処理する場合は修正すること
				r.resbody.html("").append(r.trueResbody.clone(true).contents()).removeClass("deleted");
			}
			var css = $("#nicoDicBBSViewerCSS");
			if(GM_getValue("seethroughNG")){
				if(css.html().indexOf("deleted") === -1){
					css.html(css.html() + ".deleted{display:none}");
				}
			}else{
				if(css.html().indexOf("deleted") !== -1){
					css.html(css.html().replace(".deleted{display:none}", ""));
				}
			}
		}
		$(window).unbind("scroll.iframe").bind("scroll.iframe", $(".iframe"), function(e){
			e.data.each(recover);
		});
	};

	var revivalAllRes = function(){
		for(var i = 0; i < responds.res.length; i++){
			if(responds.res[i].reshead.hasClass("deleted")){
				responds.res[i].reshead.removeClass("deleted").find(".name").html(responds.res[i].trueReshead.attr("data-name"));//ここで.nameと.tripが一緒になる。.tripを個別に処理する場合は修正すること
				responds.res[i].resbody.html("").append(responds.res[i].trueResbody.clone(true).contents()).removeClass("deleted");
			}
		}
	}

	function ManagerToReadBbs(urls){
		this.bbsUrls = urls;
		if(document.URL.indexOf("#") === -1){
			this.startIndex = urls.indexOf(document.URL);
		}else{
			var mainurl = document.URL.substring(0, document.URL.indexOf("#"));
			if(mainurl.indexOf("-") === -1){
				mainurl = mainurl + "-";
			}
			this.startIndex = urls.indexOf(mainurl);
		}
		this.endIndex = this.startIndex;
	};

	var readPreviousBbs = function(){
		if(manager.isNowLoading || manager.startIndex <= 0){
			return;
		}
		manager.isNowLoading = true;
		manager.startIndex--;
		$.get(manager.bbsUrls[manager.startIndex], function(r){
			prependBbs($(r).find("dl"));
		});
		if(manager.startIndex === 0){
			$("#loadPreviousPageLinks").remove();
		}
		$("#bbsmain").prepend("<p id='loading'>now loading...</p>")
		return false;
	};

	var prependBbs = function(dl){
		revivalAllRes();
		parent.find("dl").prepend(dl.contents());
		createRes(parent.find("dl"));
		createResListById();
		makeTooltips();
		setContextMenu();
		for(var i = 0; i < responds.res.length; i++){
			responds.res[i].backupRes();
		}
		applyNG();
		$("#loading").remove();
		manager.isNowLoading = false;
	};

	var readNextBbs = function(){
		if(manager.isNowLoading || manager.endIndex >= manager.bbsUrls.length - 1){
			return;
		}
		manager.isNowLoading = true;
		manager.endIndex++;
		$.get(manager.bbsUrls[manager.endIndex], function(r){
			nextBbs($(r).find("dl"));
		});
		if(manager.endIndex === manager.bbsUrls.length - 1){
			$("#loadNextPageLinks").remove();
		}
		$("#bbsmain").append("<p id='loading'>now loading...</p>");
		return false;
	};

	var nextBbs = function(dl){
		revivalAllRes();
		parent.find("dl").append(dl.contents());
		createRes(parent.find("dl"));
		createResListById();
		makeTooltips();
		setContextMenu();
		for(var i = 0; i < responds.res.length; i++){
			responds.res[i].backupRes();
		}
		applyNG();
		$("#loading").remove();
		manager.isNowLoading = false;
	};

	var initSmallBbs = function(){
		createRes(parent.find("dl"));
		if(document.URL.indexOf("http://dic.nicovideo.jp/b/") !== -1 || GM_getValue("tooltipOnDicPage")){
			createResListById();
			makeTooltips();
		}else{
			makeIDDiv();
		}
		for(var i = 0; i < responds.res.length; i++){
			responds.res[i].backupRes();
		}
		setMenu();
		setContextMenu();
		bindMenu();
		initNG();
		applyNG();
	};

	var initPagerForThirtyBbs = function(){
		pager.eq(0).find("a:not(:first), .current, span").remove();
		if(manager.startIndex > 0){
			pager.eq(0).append("<a id='loadPreviousPageLinks' href='#'>前へ</a>");
			pager.find("#loadPreviousPageLinks").click(readPreviousBbs);
		}
		pager.eq(1).find("a:not(:first), .current, span").remove();
		if(manager.endIndex < manager.bbsUrls.length - 1){
			pager.eq(1).append("<a id='loadNextPageLinks' href='#'>次へ</a>");
			pager.find("#loadNextPageLinks").click(readNextBbs);
		}
	}
	
	var initConfig = function(ids){
		for(var i = 0; i < ids.length; i++){
			if(GM_getValue(ids[i]) === undefined){
				GM_setValue(ids[i], true);
			}
		}
	}

	var insertStyle = function(){
		var idStyle = ".ID{text-decoration:underline; color:black; display:inline;} .IDMulti{text-decoration:underline; color:blue; display:inline;}" +
					".IDMany{text-decoration:underline; color:red; display:inline;}";
		var numberStyle = ".Number{text-decoration: underline; display:inline;} .NumberMulti{text-decoration: underline; display:inline; color:blue;}" +
					".NumberMany{text-decoration: underline; display:inline; color:red;}";
		var insideTooltipStyle = ".dic{display:inline;}";
		var onMouseIdStyle = ".ID:hover, .IDMulti:hover, .IDMany:hover, .dic:hover{text-decoration:none;}";
		var defaultTooltipStyle = ".ID>div, .IDMulti>div, .IDMany>div, .dic>div, .Number>div, .NumberMulti>div, .NumberMany>div, .NumberHandle>div{display:none;}";
		var onMouseTooltipStyle = ".ID:hover>div, .IDMulti:hover>div, .IDMany:hover>div, .numTooltip:hover>div," + 
								" .Number:hover>div, .NumberMulti:hover>div, .NumberMany:hover>div, .NumberHandle:hover>div" + 
								"{color:black; display:inline; position:absolute; background:#f5f5b5; border:solid black 1px; padding;5px; font-size:8pt; overflow:auto;" + 
								" box-shadow:1px 1px; z-index:10000;}";
		var leftboxStyle = "div.left-box{border: groove 1px gray; border-radius: 5px; background-image:none;}";
		var ngStyle = "#ng{display:none;}";
		var hideMenu = "#topbarRightMenu #bbsLi.selected,#topbarRightMenu #ngLi.selected{display:none;}"; 
		var sidemenu = "ul#sidemenu li{border:solid 1px; width:100px;} ul#sidemenu li.selected{color:red;}";
		var contextMenuStyle = "#contextMenu{background : #d4d0c8;color : #000000;display : none;position : absolute;list-style : none;	padding-left : 0px;box-shadow : 1px 1px;}";
		var contextItemStyle = "#contextMenu li{padding : 3px;}#contextMenu li:hover{background : #0a246a;color : #ffffff;}";

		var styleTag = "<style id='nicoDicBBSViewerCSS' type='text/css'>" + idStyle + numberStyle + insideTooltipStyle + onMouseIdStyle + defaultTooltipStyle + 
			onMouseTooltipStyle + leftboxStyle + ngStyle + hideMenu + sidemenu + contextMenuStyle + contextItemStyle + "</style>";

		$("link").eq(1).after($(styleTag));
	};

	var counterAutopagerize = function(){
		$(document).bind("AutoPagerize_DOMNodeInserted", function(){
			$("[class^='autopagerize'] , dl:not(#bbsmain) , #autopagerize_message_bar").remove();
		});
	};

	var scrollLoader = function(){
		var reserved = false;
		setInterval(function(){
			if(reserved){
				reserved = false;
				readNextBbs();
			}
		}, 1000);
			$(window).scroll(function(){
			if($(".selected").attr("id") === "bbsLi" && GM_getValue("autoLoad") && $("html").scrollTop() + $(window).height() > $("#bbsmain").position().top + $("#bbsmain").height()){
				reserved = true;
			}
		});
	};

//以下main
	var nglist = {};//ngid,ngname,ngresたちのまとめ。
	var responds = {};//Resオブジェクトの配列"res"、ResオブジェクトのIDによる連想配列"resListById"が格納。
	var main = function(){
		initConfig(["useNG", "autoLoad", "tooltipOnDicPage", "showIDTooltip", "showResAnchorTooltip", "showResNumberTooltip", "showResHandleTooltip", 
					"classificationID", "classificationResNumber"]);
		insertStyle();
		var parent = $("#bbs");
		parent.find("dl").attr("id", "bbsmain");
		var bbsScroll = 0;
		var pager = parent.find(".pager");
		nglist = initNG();
		$(".border").remove();
		var urlAnalyzer = new UrlAnalyzer();
		if(urlAnalyzer.inArticlePage()){
			pager.find(".navi").remove();
			initSmallBbs();
		}else{
			var manager = new ManagerToReadBbs(urlAnalyzer.getBBSURLs(pager.eq(0)));
			counterAutopagerize();
			initPagerForThirtyBbs();
			initSmallBbs();
			scrollLoader();
		}
	};
	//main();
	//-----test用-----
	var c = net_threeaster_NicoDicBBSViewer;
	c.removeUselessLines = removeUselessLines;
	c.setContextMenu = setContextMenu;
	c.Res = Res;
	c.makeIDDiv = makeIDDiv;
	c.getResByNumber = getResByNumber;
	c.controlTooltip = controlTooltip;
	c.getOtherBBS = getOtherBBS;
	c.delayiframe = delayiframe;
	c.makeTooltips = makeTooltips;
	c.bindMenu = bindMenu;
	c.recover = recover;
	c.showres = showres;
	c.ajustSideMenu = ajustSideMenu;
	c.getCheckbox = getCheckbox;
	c.setMenu = setMenu;
	c.initNG = initNG;
	c.applyNG = applyNG;
	c.revivalAllRes = revivalAllRes;
	c.ManagerToReadBbs = ManagerToReadBbs;
	c.readPreviousBbs = readPreviousBbs;
	c.prependBbs = prependBbs;
	c.readNextBbs = readNextBbs;
	c.nextBbs = nextBbs;
	c.initSmallBbs = initSmallBbs;
	c.initPagerForThirtyBbs = initPagerForThirtyBbs;
	c.initConfig = initConfig;
	c.nglist = nglist;
	c.insertStyle = insertStyle;
	c.UrlAnalyzer = UrlAnalyzer;
	c.ResList = ResList;
})(jQuery);
