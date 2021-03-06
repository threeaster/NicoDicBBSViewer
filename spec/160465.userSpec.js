describe("", function(){
	var c;
	var $;
	var GM_value;
	beforeEach(function(){
		c = net_threeaster_NicoDicBBSViewer;
		$ = jQuery;
		$('head').append('<link id="dummy_link">');
		GM_value = {};
		GM_setValue = function(name, value){
			GM_value[name] = value;
		};
		GM_getValue = function(name){
			return GM_value[name];
		};
		jasmine.addMatchers({
			toEqualAsUrl: function(util, customEqualityTesters){
				return{
					compare: function(actual, expected){
						var urls = [actual, expected];
						for(var i = 0; i < urls.length; i++){
							urls[i] = urls[i].replace('http://', '');
							urls[i] = urls[i].replace('file://', '');
							var split_domain = /:\d+/;
							if(urls[i].match(split_domain)){
								urls[i] = urls[i].split(split_domain)[1];
							}
						}
						actual = urls[0];
						expected = urls[1];
						var pass = actual === expected;
						var message = "";
						if(pass){
							message = actual + "is not expected " + expected;
						}else{
							message = actual + "is expected " + expected;
						}
						var result = {};
						result.pass = pass;
						result.message = message;
						return result;
					}
				};
			}
		});
	});

	afterEach(function(){
		$('#dummy_link').remove();
		GM_value = {};
	});

	var constructDl = function(reshead, resbody){
		var html = "<dl>";
		for(var i = 0; i < reshead.length; i++){
			html = html + reshead[i] + resbody[i];
		}
		html = html + "</dl>";
		return html;
	}

	describe("initConfigのテスト", function(){
		it("引数に与えられたidたちの中で定義されていないものをtrueにする", function(){
			//setUp
			var id1 = "id1";
			var id2 = "id2";
			//exercise
			c.initConfig([id1, id2]);
			//verify
			expect(GM_getValue(id1)).toEqual(true);
			expect(GM_getValue(id2)).toEqual(true);
		});

		it("引数に与えられたidが定義されていたならば変更しない", function(){
			//setUp
			var id1 = "id1";
			var id2 = "id2";
			GM_setValue(id1, true);
			GM_setValue(id2, false);
			//exercise
			c.initConfig([id1, id2]);
			//verify
			expect(GM_getValue(id1)).toEqual(true);
			expect(GM_getValue(id2)).toEqual(false);
		});
	});	

	describe("removeUselessLinesのテスト", function(){
		it("空文字列ならばundefinedが返される", function(){	//空文字列を返したほうが良いかも
			//setUp
			var argument = "";
			//exercise
			var actual = c.removeUselessLines(argument);
			//verify
			expect(actual).toEqual(undefined);
		});

		it("空行が含まれるとき空行が削除される", function(){
			//setUp
			var argument = "あ\n\nい\n";
			//exercise
			var actual = c.removeUselessLines(argument);
			//verify
			expect(actual).toEqual("あ\nい");
		});

		it("重複行が含まれるとき重複が削除される", function(){
			//setUp
			var argument = "あ\nい\nあ";
			//exercise
			var actual = c.removeUselessLines(argument);
			//verify
			expect(actual).toEqual("あ\nい");
		});
	});
	
	describe("insertStyleのテスト", function(){//TODO 実際にタグを挿入してスタイルを確かめる
		it("styleタグが挿入される", function(){
			//exercise
			c.insertStyle();
			//verify
			expect($("style#nicoDicBBSViewerCSS").size()).toEqual(1);
			//tearDown
			$("style#nicoDicBBSViewerCSS").remove();
		});
	});

	describe("UrlAnalyzerのテスト", function(){
		describe("inArticlePageのテスト", function(){
			var sut;
			beforeEach(function(){
				sut = new c.UrlAnalyzer();
			});

			it("記事ページにいるときにtrueを返す", function(){
				//setUp
				spyOn(sut, "getNowUrl").and.returnValue("http://dic.nicovideo.jp/a/%E3%82%A4%E3%83%8A%E3%83%90");
				//exercise
				var actual = sut.inArticlePage();
				//verify
				expect(actual).toEqual(true);
			});

			it("掲示板ページにいるときにfalseを返す", function(){
				//estUp
				spyOn(sut, "getNowUrl").and.returnValue("http://dic.nicovideo.jp/b/a/%E3%82%A4%E3%83%8A%E3%83%90/1-");
				//exercise
				var actual = sut.inArticlePage();
				//verify
				expect(actual).toEqual(false);
			})
		});

		describe("getBBSURLsのテスト", function(){
			var sut;
			beforeEach(function(){
				sut = new c.UrlAnalyzer();
			});

			describe("記事ページで", function(){
				beforeEach(function(){
					spyOn(sut, "inArticlePage").and.returnValue(true);
				});

				it("レス数30以下の時、掲示板ページのurl一つを持つ配列が帰ってくる", function(){
					//serUp
					var basicUrl = "/b/a/%E3%82%A4%E3%83%8A%E3%83%90/";
					var pager = '<div class="pager"><a href="/a/%E3%82%A4%E3%83%8A%E3%83%90" class="navi">-イナバの記事へ戻る-</a>' + 
								'<a href="' + basicUrl + '1-">1-</a></div>';
					spyOn(sut, "getNowUrl").and.returnValue("http://dic.nicovideo.jp/a/%E3%82%A4%E3%83%8A%E3%83%90");
					//exercise
					var actual = sut.getBBSURLs($(pager));
					//verify
					//basicUrl = $("<a>").attr("href", basicUrl).get(0).href;
					expect(actual.length).toEqual(1);
					expect(actual[0]).toEqualAsUrl(basicUrl + "1-");
				});

				it("レス数が30より多い時、掲示板ページをすべて含む配列が帰ってくる", function(){
					//setUP
					var basicUrl = "/b/a/greasemonkey/";
					var pager = '<div class="pager"><a href="/a/greasemonkey" class="navi">-Greasemonkeyの記事へ戻る-</a>' + 
								'<a href="' + basicUrl + '121-" class="navi">&#171; 前へ</a><a href="' + basicUrl + '1-"> 1 </a><span>....</span>' + 
								'<a href="' + basicUrl + '61-">61-</a><a href="' + basicUrl + '91-">91-</a>' + 
								'<a href="' + basicUrl + '121-">121-</a><a href="' + basicUrl + '151-">151-</a></div>';
					spyOn(sut, "getNowUrl").and.returnValue("http://dic.nicovideo.jp/a/greasemonkey");
					//exersise
					var actual = sut.getBBSURLs($(pager));
					//berify
					expect(actual.length).toEqual(6);
					expect(actual[0]).toEqualAsUrl(basicUrl + "1-");
					expect(actual[1]).toEqualAsUrl(basicUrl + "31-");
					expect(actual[2]).toEqualAsUrl(basicUrl + "61-");
					expect(actual[3]).toEqualAsUrl(basicUrl + "91-");
					expect(actual[4]).toEqualAsUrl(basicUrl + "121-");
					expect(actual[5]).toEqualAsUrl(basicUrl + "151-");
				});

				it("レス数が0の時、空の配列が帰ってくる", function(){
					//exercise
					var actual = sut.getBBSURLs($("<html></html>").find(".pager"));
					//verify
					expect(actual.length).toEqual(0);
				});
			});

			describe("掲示板ページで", function(){
				beforeEach(function(){
					spyOn(sut, "inArticlePage").and.returnValue(false);
				});

				it("レス数30以下で掲示板ページの時、掲示板ページのurl一つを持つ配列が帰ってくる", function(){
					lessThan31Test("http://dic.nicovideo.jp/b/a/%E3%82%A4%E3%83%8A%E3%83%90/1-");
				});

				it("レス数30以下で掲示板ページで、#を含む時、掲示板ページのurl一つを持つ配列が帰ってくる", function(){
					lessThan31Test("http://dic.nicovideo.jp/b/a/%E3%82%A4%E3%83%8A%E3%83%90/1-#1");
				});

				var lessThan31Test = function(nowUrl){
					//setUP
					var basicUrl = "/b/a/%E3%82%A4%E3%83%8A%E3%83%90/";
					var pager = '<div class="pager"><a href="/a/%E3%82%A4%E3%83%8A%E3%83%90" class="navi">-イナバの記事へ戻る-</a>' +
							'<span class="current">1-</span></div>';
					spyOn(sut, "getNowUrl").and.returnValue(nowUrl);
					//exercise
					var actual = sut.getBBSURLs($(pager));
					//verify
					expect(actual.length).toEqual(1);
					expect(actual[0]).toEqualAsUrl("dic.nicovideo.jp" + basicUrl + "1-");
				};

				it("レス数が30より多く、その中ほどのページの時、掲示板ページをすべて含む配列が帰ってくる", function(){
					moreThan30AtNotEndTest("http://dic.nicovideo.jp/b/a/greasemonkey/91-");
				});

				it("レス数が30より多く、その中ほどのページで、#を含む時、掲示板ページをすべて含む配列が帰ってくる", function(){
					moreThan30AtNotEndTest("http://dic.nicovideo.jp/b/a/greasemonkey/91-");
				});

				var moreThan30AtNotEndTest = function(nowUrl){
					//setUp
					var basicUrl = "/b/a/greasemonkey/";
					var pager = '<div class="pager"><a href="/a/greasemonkey" class="navi">-Greasemonkeyの記事へ戻る-</a>' + 
								'<a href="' + basicUrl + '61-" class="navi">&#171; 前へ</a><a href="' + basicUrl + '1-">1-</a><a href="' + basicUrl + '31-">31-</a>' + 
								'<a href="' + basicUrl + '61-">61-</a><span class="current">91-</span><a href="' + basicUrl + '121-">121-</a>' + 
								'<a href="' + basicUrl + '151-">151-</a><a href="' + basicUrl + '121-" class="navi">次へ &#187;</a></div>';
					spyOn(sut, "getNowUrl").and.returnValue(nowUrl);
					//exercise
					var actual = sut.getBBSURLs($(pager));
					//verify
					expect(actual.length).toEqual(6);
					expect(actual[0]).toEqualAsUrl(basicUrl + "1-");
					expect(actual[1]).toEqualAsUrl(basicUrl + "31-");
					expect(actual[2]).toEqualAsUrl(basicUrl + "61-");
					expect(actual[3]).toEqualAsUrl(basicUrl + "91-");
					expect(actual[4]).toEqualAsUrl(basicUrl + "121-");
					expect(actual[5]).toEqualAsUrl(basicUrl + "151-");
				}

				it("レス数が30より多く、最終ページの時、掲示板ページをすべて含む配列が帰ってくる", function(){
					moreThan30AtEndTest("http://dic.nicovideo.jp/b/a/greasemonkey/151-");
				});

				it("レス数が30より多く、最終ページで、#を含むの時、掲示板ページをすべて含む配列が帰ってくる", function(){
					moreThan30AtEndTest("http://dic.nicovideo.jp/b/a/greasemonkey/151-#151");
				});

				var moreThan30AtEndTest = function(nowUrl){
					var basicUrl = "/b/a/greasemonkey/";
					var pager = '<div class="pager"><a href="/a/greasemonkey" class="navi">-Greasemonkeyの記事へ戻る-</a>' +
								'<a href="' + basicUrl + '121-" class="navi">&#171; 前へ</a><a href="' + basicUrl + '1-"> 1 </a><span>....</span>' + 
								'<a href="' + basicUrl + '61-">61-</a><a href="' + basicUrl + '91-">91-</a><a href="' + basicUrl + '121-">121-</a>' +
								'<span class="current">151-</span></div>';
					spyOn(sut, "getNowUrl").and.returnValue(nowUrl);
					//exercise
					var actual = sut.getBBSURLs($(pager));
					//verify
					expect(actual.length).toEqual(6);
					expect(actual[0]).toEqualAsUrl(basicUrl + "1-");
					expect(actual[1]).toEqualAsUrl(basicUrl + "31-");
					expect(actual[2]).toEqualAsUrl(basicUrl + "61-");
					expect(actual[3]).toEqualAsUrl(basicUrl + "91-");
					expect(actual[4]).toEqualAsUrl(basicUrl + "121-");
					expect(actual[5]).toEqualAsUrl(basicUrl + "151-");
				}

			});
		});

		describe("isPageOfのテスト", function(){
			var sut;
			beforeEach(function(){
				sut = new c.UrlAnalyzer();
				spyOn(sut, "getNowUrl").and.returnValue("http://dic.nicovideo.jp/a/res");
			});

			it("エンコードされた記事名を受け取り、それが現在のページと同じ記事の記事名ならばtrueを返す", function(){
				//exercise
				var actual = sut.isPageOf("res");
				//verify
				expect(actual).toEqual(true);
			});

			it("エンコードされた記事名を受け取り、それが現在のページと違う記事の記事名ならばfalseを返す", function(){
				//exercise
				var actual = sut.isPageOf("dummy");
				//verify
				expect(actual).toEqual(false);
			});

			it("urlを受け取り、それが現在のページと同じ記事のページならばtrueを返す", function(){
				//exercise
				var actaul = sut.isPageOf("http://dic.nicovideo.jp/b/a/res/1021-");
				//verify
				expect(actaul).toEqual(true);
			});

			it("urlを受け取り、それが現在のページと違う記事のページならばfalseを返す", function(){
				//exercise
				var actual = sut.isPageOf("http://dic.nicovideo.jp/b/a/dummy/31-");
				//verify
				expect(actual).toEqual(false);
			});

			it("コロンつきurlを受け取り、それが現在のページと同じ記事のページならばtrueを返す", function(){
				//exercise
				var actual = sut.isPageOf("http://dic.nicovideo.jp/a/res:34");
				//exercise
				expect(actual).toEqual(true);
			});

			it("コロンつきurlを受け取り、それが現在のページと違う記事のページならばfalseを返す", function(){
				//exercise
				var actual = sut.isPageOf("http://dic.nicovideo.jp/a/dummy:34");
				//verify
				expect(actual).toEqual(false);
			});

			it("シャープつきurlを受け取り、それが現在のページと同じ生地のページならばtrueを返す", function(){
				//exercise
				var actual = sut.isPageOf("http://dic.nicovideo.jp/a/res#h2-1");
				//exercise
				expect(actual).toEqual(true);
			});

			it('同名の生放送記事を受け取った時、falseを返す', function(){
				var actual = sut.isPageOf('http://dic.nicovideo.jp/l/res');
				expect(actual).toEqual(false);
			})
		});

		describe("getNowPageNameのテスト", function(){
			var sut;
			beforeEach(function(){
				sut = new c.UrlAnalyzer();
			});

			it("現在記事ページにいる時、記事名を返す", function(){
				//setUP
				spyOn(sut, "getNowUrl").and.returnValue("http://dic.nicovideo.jp/a/res");
				//exercise
				var actual = sut.getNowPageName();
				//verify
				expect(actual).toEqual("res");
			});

			it("現在記事ページにいて、urlに#が付いている時も記事名を返す", function(){
				//setUP
				spyOn(sut, "getNowUrl").and.returnValue("http://dic.nicovideo.jp/a/res#id");
				//exercise
				var actual = sut.getNowPageName();
				//verify
				expect(actual).toEqual("res");
			});

			it("現在掲示板ページにいる時、記事名を返す", function(){
				//setUP
				spyOn(sut, "getNowUrl").and.returnValue("http://dic.nicovideo.jp/b/a/res/1021-");
				//exercise
				var actual = sut.getNowPageName();
				//verify
				expect(actual).toEqual("res");
			});

			it("現在掲示板ページにいて、urlに#が付いている時も記事名を返す", function(){
				//setUP
				spyOn(sut, "getNowUrl").and.returnValue("http://dic.nicovideo.jp/v/sm1");
				//exercise
				var actual = sut.getNowPageName();
				//verify
				expect(actual).toEqual("sm1");
			});

			it('現在動画ページにいる時、記事名を返す', function(){
				spyOn(sut, "getNowUrl").and.returnValue("http://dic.nicovideo.jp/b/a/res/1021-#1024");
			});
		});

		describe('getPageTypeのテスト', function(){
			var sut;
			beforeEach(function(){
				sut = new c.UrlAnalyzer();
			});

			it('相対パスの記事ページの時aを返す', function(){
				var actual = sut.getPageType('/a/res');
				expect(actual).toEqual('a');
			});

			it('絶対パスの記事ページの時aを返す', function(){
				var actual = sut.getPageType("http://dic.nicovideo.jp/a/res");
				expect(actual).toEqual('a');
			});

			it('相対パスの掲示板ページの時aを返す', function(){
				var actual = sut.getPageType('/b/a/res/1-');
				expect(actual).toEqual('a');
			});
		});

		describe("changeNumberのテスト", function(){
			var sut;;
			beforeEach(function(){
				sut = new c.UrlAnalyzer();
			})

			it("記事ページでは引数をそのまま返す", function(){
				//setUp
				var now = "http://dic.nicovideo.jp/a/res";
				spyOn(sut, "getNowUrl").and.returnValue(now);
				//exercise
				var actual = sut.changeNumber(now);
				//verify
				expect(actual).toEqual(now);
			});

			it("掲示板ページでは番号が現在のものに変更されて戻ってくる", function(){
				//setUP
				var nowParts = "http://dic.nicovideo.jp/b/a/res/";
				spyOn(sut, "getNowUrl").and.returnValue(nowParts + "1-");
				//exercise
				var actual = sut.changeNumber(nowParts + "31-#31");
				//verify
				expect(actual).toEqual(nowParts + "1-#31");
			});
		});
	});

	describe("ResCollectionのテスト", function(){
		describe("createResListのテスト", function(){
			it("dlを渡すとresponds.resができる", function(){
				//setUp
				var sut = new c.ResCollection();
				var reshead1 = '<dt class="reshead"><a name="1" class="resnumhead"></a>1 ： <span class="name">ななしのよっしん</span>：2011/02/27(日) 20:44:39 ID: s1ywEd/dRU </dt>';
	  			var resbody1 = '<dd class="resbody"> <a class="auto" href="/a/%E3%83%AC%E3%82%B9">レス</a>' +
	 							'<a class="auto" href="/a/%E3%81%AB%E3%81%A4%E3%81%84%E3%81%A6%E8%AA%9E%E3%82%8B%E3%82%B9%E3%83%AC">' +
	  							'について語るスレ</a><br>↑なぜか吹いたｗ </dd>';
	  			var reshead2 = '<dt class="reshead"> <a name="2" class="resnumhead"></a>2 ： <span class="name">ななしのよっしん</span> ：2011/03/16(水) 01:40:04 ID: CGzYMTAdwz </dt>';
	  			var resbody2 = '<dd class="resbody"> 逆から読んでも「<a class="auto" href="/a/%E3%83%AC%E3%82%B9">レス</a>' +
	  							'<a class="auto" href="/a/%E3%81%AB%E3%81%A4%E3%81%84%E3%81%A6%E8%AA%9E%E3%82%8B%E3%82%B9%E3%83%AC">について語るスレ</a>」だよ！<br>' +
	  							'<a class="auto" href="/a/%E3%81%99%E3%81%94%E3%81%84">すごい</a>でしょ！ </dd>';
				var html = '<dl>' + reshead1 + resbody1 + reshead2 + resbody2 + '</dl>';
	  			var dl = $(html);
	  			//exercise
	  			sut.createResList(dl);
	  			//verify
	  			var resList = sut.resList;
	  			expect(resList.length).toEqual(2);
	  			expect(resList[0].reshead.html()).toEqual($(reshead1).attr("data-number", "1").attr("data-name", "ななしのよっしん").attr("data-id", "s1ywEd/dRU").html());
	  			expect(resList[0].resbody.html()).toEqual($(resbody1).html());
	  		});
		});

		describe("createResListByIdのテスト", function(){
			it("createResListした後にcreateResListByIdすると、idをハッシュに持つResのマップresListByIdが作れる", function(){
				//serUp
				var sut = new c.ResCollection();
				var reshead1 = '  <dt class="reshead"><a name="12" class="resnumhead"></a>12 ： <span class="name">ななしのよっしん</span>' + 
								' ：2008/05/29(木) 13:04:16 ID: VEXO5K3Cit</dt>';
				var resbody1 = '  <dd class="resbody"><a class="auto" href="/a/TAS">TAS</a>だと、<a class="auto" href="/a/%E7%A2%BA%E7%AB%8B">確立</a>' + 
								'監視ならともかく、操作は出来なくない？</dd>';
				var reshead2 = '<dt class="reshead"><a name="13" class="resnumhead"></a>13 ： <span class="name">ななしのよっしん</span>' + 
								' ：2008/05/29(木) 21:50:49 ID: ZC/SF+vbue</dt>';
				var resbody2 = '  <dd class="resbody"><a href="/b/a/tas/1-#12" rel="nofollow" target="_blank" class="dic">&gt;&gt;12</a>' +
								'<br>出したい結果が出るまで繰り返すってことじゃないか？<br>例）<a class="auto" href="/a/%E3%82%B5%E3%82%A4%E3%82%B3%E3%83%AD">サイコロ</a>の' + 
								'<a class="auto-hdn" href="/a/%E7%9B%AE">目</a>で１が出るまで、振り始める<a class="auto-hdn" href="/a/%E7%9E%AC">瞬</a>間まで戻って振り直す' +
								'<br><br><a class="auto" href="/a/%E7%A2%BA%E7%8E%87">確率</a>操作とは違うか……？</dd>';
				var reshead3 = '  <dt class="reshead"><a name="14" class="resnumhead"></a>14 ： <span class="name">ななしのよっしん</span>' +
								' ：2008/05/29(木) 22:19:35 ID: VEXO5K3Cit</dt>';
				var resbody3 = '  <dd class="resbody"><a href="/b/a/tas/1-#13" rel="nofollow" target="_blank" class="dic">&gt;&gt;13</a>' +
								'<br><a class="auto" href="/a/TAS">TAS</a>の場合、なんどQLしても同じ<a class="auto" href="/a/%E3%83%95%E3%83%AC%E3%83%BC%E3%83%A0">フレーム</a>なら</dd>';  
				var html = "<dl>" + reshead1 + resbody1 + reshead2 + resbody2 + reshead3 + resbody3 + "</dl>";
				sut.createResList($(html));
				//exercise
				sut.createResListById();
				//verify
				var resListById = sut.resListById;
				expect(resListById["CGzYMTAdwz"]).toBeUndefined();
				expect(resListById["ZC/SF+vbue"].length).toEqual(1);
				expect(resListById["ZC/SF+vbue"][0].resbody.html()).toEqual($(resbody2).html());
				expect(resListById["VEXO5K3Cit"].length).toEqual(2);
				expect(resListById["VEXO5K3Cit"][0].resbody.html()).toEqual($(resbody1).html());
				expect(resListById["VEXO5K3Cit"][1].resbody.html()).toEqual($(resbody3).html());
			});
		});

		describe("createResListByNumberのテスト", function(){
			it("createResListした後にcreateResListByNumberすると、レス番号をindexにもつ配列が作られる", function(){
				//setUp
				var sut = new c.ResCollection();
				var reshead = [];
				var resbody = [];
				reshead[0] = '<dt class="reshead"><a name="5" class="resnumhead"></a>5 ： <span class="name">ななしのよっしん</span> ：2009/01/11(日) 23:44:16 ID: b6fD7NC5x/</dt>';
				resbody[0] = '<dd class="resbody"><a href="/b/a/name/1-#2" rel="nofollow" target="_blank" class="dic">&gt;&gt;7</a></dd>';
				reshead[1] = '<dt class="reshead"><a name="6" class="resnumhead"></a>6 ： <span class="name">ななしのよっしん</span> ：2009/01/11(日) 23:44:16 ID: b6fD7NC5x/</dt>';
				resbody[1] = '<dd class="resbody"><a href="/b/a/name/1-#2" rel="nofollow" target="_blank" class="dic">&gt;&gt;2</a></dd>';
	   			var html = constructDl(reshead, resbody);
	   			sut.createResList($(html));
	   			//exercise
	   			sut.createResListByNumber();
	   			//verify
	   			var list = sut.resListByNumber;
	   			expect(list[0]).toBeUndefined();
	   			expect(list[5]).toEqual(sut.resList[0]);
			});
		});

		describe("makeTooltipsのテスト", function(){
			var reshead;
			var resbody;
			var res;
			var list;
			beforeEach(function(){
				reshead = [];
				resbody = [];
				res = [];
				reshead[0] = '<dt class="reshead"><a name="1" class="resnumhead"></a>1 ： <span class="name">1</span> ：2009/01/11(日) 23:44:16 ID: b6fD7NC5x/</dt>';
				resbody[0] = '<dd class="resbody"><a href="/b/a/name/1-#1" rel="nofollow" target="_blank" class="dic">&gt;&gt;1</a></dd>';
				var html = constructDl(reshead, resbody);
				list = new c.ResCollection();
				list.createResList($(html));
				list.createResListById();
				list.createResListByNumber();
				for(var i = 0; i < list.resList.length; i++){
					res[i] = list.resList[i];
				}
			});

			it("全てのフラグがオンのとき、全てのツールチップが作られる", function(){
				//setUp
				GM_setValue("tooltipOnDicPage", true);
				GM_setValue("showIDTooltip", true);
				GM_setValue("showResAnchorTooltip", true);
				GM_setValue("showResNumberTooltip", true);
				GM_setValue("showResHandleTooltip", true);
				//exercise
				list.makeTooltips(list);
				//verify
				res[0].reshead.find("div[class^='ID']").trigger("mouseenter");
				expect(res[0].reshead.find("div[class^='ID'] > div .reshead").size()).toEqual(1);
				res[0].reshead.find("div[class^='ID']").trigger("mouseleave");
				res[0].resbody.find("a.dic").trigger("mouseenter");
				expect(res[0].resbody.find("span.numTooltip > div .reshead").size()).toEqual(1);
				res[0].resbody.find("a.dic").trigger("mouseleave");
				res[0].reshead.find("div[class^='Number']").trigger("mouseenter");
				expect(res[0].reshead.find("div[class^='Number'] div:not([class^='Number']) .reshead").size()).toEqual(1);
				res[0].reshead.find("div[class^='Number']").trigger("mouseleave");
				res[0].reshead.find("span.NumberHandle").trigger("mouseenter");
				expect(res[0].reshead.find("span.NumberHandle > div .reshead").size()).toEqual(1);
				res[0].reshead.find("span.NumberHandle").trigger("mouseleave");
			});

			it("全てのフラグがオフのとき、なにもツールチップは作られない", function(){
				//exercise
				GM_setValue("tooltipOnDicPage", true);
				list.makeTooltips(list);
				//verify
				res[0].reshead.find("div[class^='ID']").trigger("mouseenter");
				expect(res[0].reshead.find("div[class^='ID'] > div .reshead").size()).toEqual(0);
				res[0].reshead.find("div[class^='ID']").trigger("mouseleave");
				res[0].resbody.find("a.dic").trigger("mouseenter");
				expect(res[0].resbody.find("span.numTooltip > div .reshead").size()).toEqual(0);
				res[0].resbody.find("a.dic").trigger("mouseleave");
				res[0].reshead.find("div[class^='Number']").trigger("mouseenter");
				expect(res[0].reshead.find("div[class^='Number'] div:not([class^='Number']) .reshead").size()).toEqual(0);
				res[0].reshead.find("div[class^='Number']").trigger("mouseleave");
				res[0].reshead.find("span.NumberHandle").trigger("mouseenter");
				expect(res[0].reshead.find("span.NumberHandle > div .reshead").size()).toEqual(0);
				res[0].reshead.find("span.NumberHandle").trigger("mouseleave");
			});

			it("tooltipOnDicPageがオフの時、記事ページではフラグがオンになっていてもツールチップは作られない", function(){
				//setUP
				GM_setValue("showIDTooltip", true);
				GM_setValue("showResAnchorTooltip", true);
				GM_setValue("showResNumberTooltip", true);
				GM_setValue("showResHandleTooltip", true);
				spyOn(list.urlAnalyzer, "inArticlePage").and.returnValue(true);
				//exercise
				list.makeTooltips(list);
				//verify
				res[0].reshead.find("div[class^='ID']").trigger("mouseenter");
				expect(res[0].reshead.find("div[class^='ID'] > div .reshead").size()).toEqual(0);
				res[0].reshead.find("div[class^='ID']").trigger("mouseleave");
				res[0].resbody.find("a.dic").trigger("mouseenter");
				expect(res[0].resbody.find("span.numTooltip > div .reshead").size()).toEqual(0);
				res[0].resbody.find("a.dic").trigger("mouseleave");
				res[0].reshead.find("div[class^='Number']").trigger("mouseenter");
				expect(res[0].reshead.find("div[class^='Number'] div:not([class^='Number']) .reshead").size()).toEqual(0);
				res[0].reshead.find("div[class^='Number']").trigger("mouseleave");
				res[0].reshead.find("span.NumberHandle").trigger("mouseenter");
				expect(res[0].reshead.find("span.NumberHandle > div .reshead").size()).toEqual(0);
				res[0].reshead.find("span.NumberHandle").trigger("mouseleave");
			});

			it("tooltipOnDicPageがオフの時、掲示板ページではフラグがオンになっていればツールチップは作られる", function(){
				//setUP
				GM_setValue("showIDTooltip", true);
				GM_setValue("showResAnchorTooltip", true);
				GM_setValue("showResNumberTooltip", true);
				GM_setValue("showResHandleTooltip", true);
				spyOn(list.urlAnalyzer, "inArticlePage").and.returnValue(false);
				//exercise
				list.makeTooltips(list);
				//verify
				res[0].reshead.find("div[class^='ID']").trigger("mouseenter");
				expect(res[0].reshead.find("div[class^='ID'] > div .reshead").size()).toEqual(1);
				res[0].reshead.find("div[class^='ID']").trigger("mouseleave");
				res[0].resbody.find("a.dic").trigger("mouseenter");
				expect(res[0].resbody.find("span.numTooltip > div .reshead").size()).toEqual(1);
				res[0].resbody.find("a.dic").trigger("mouseleave");
				res[0].reshead.find("div[class^='Number']").trigger("mouseenter");
				expect(res[0].reshead.find("div[class^='Number'] div:not([class^='Number']) .reshead").size()).toEqual(1);
				res[0].reshead.find("div[class^='Number']").trigger("mouseleave");
				res[0].reshead.find("span.NumberHandle").trigger("mouseenter");
				expect(res[0].reshead.find("span.NumberHandle > div .reshead").size()).toEqual(1);
				res[0].reshead.find("span.NumberHandle").trigger("mouseleave");
			});

		});

		describe("showResのテスト", function(){
			it("showResはResCollectionの中身を#bbsに追加する", function(){
				//setUp
				var sut = new c.ResCollection();
				var reshead = [];
				var resbody = [];
				reshead[0] = '<dt class="reshead"><a name="5" class="resnumhead"></a>5 ： <span class="name">ななしのよっしん</span> ：2009/01/11(日) 23:44:16 ID: b6fD7NC5x/</dt>';
				resbody[0] = '<dd class="resbody"><a href="/b/a/name/1-#7" rel="nofollow" target="_blank" class="dic">&gt;&gt;7</a></dd>';
				reshead[1] = '<dt class="reshead"><a name="6" class="resnumhead"></a>6 ： <span class="name">ななしのよっしん</span> ：2009/01/11(日) 23:44:16 ID: b6fD7NC5x/</dt>';
				resbody[1] = '<dd class="resbody"><a href="/b/a/name/1-#2" rel="nofollow" target="_blank" class="dic">&gt;&gt;2</a></dd>';
	   			var html = constructDl(reshead, resbody);
	   			sut.createResList($(html));
	   			$("body").append("<div id='bbs'><dl></dl></div>");
	   			//exercise
	   			sut.showRes();
	   			//verify
	   			expect($("#bbs dl .reshead").size()).toEqual(2);
	   			expect($("#bbs dl .reshead").eq(1).attr("data-number")).toEqual("6");
	   			//tearDown
	   			$("#bbs").remove();
			});
		});

		describe("revivalAllResのテスト", function(){
			var sut;
			var reshead;
			var resbody;
			beforeEach(function(){
				reshead = [];
				resbody = [];
				reshead[0] = '<dt class="reshead"><a name="5" class="resnumhead"></a>5 ： <span class="name">ななしのよっしん</span> ：2009/01/11(日) 23:44:16 ID: b6fD7NC5x/</dt>';
				resbody[0] = '<dd class="resbody">テスト<a href="/b/a/name/1-#7" rel="nofollow" target="_blank" class="dic">&gt;&gt;7</a></dd>';
				var html = constructDl(reshead, resbody);
				sut = new c.ResCollection();
				sut.createResList($(html));
				sut.resList[0].backupRes();
				var style = "<style id='nicoDicBBSViewerCSS' type='text/css'></style>";
				$("link").last().after(style);
			});

			afterEach(function(){
				$("#nicoDicBBSViewerCSS").remove();
			});

			it("NG処理をしたresをrevivalAllResはNGが処理される前に戻す", function(){
				//setUp
				GM_setValue("useNG", true);
				var ng = new c.NgOperator();
				ng.ngList.ngid = ["b6fD7NC5x/"];
				ng.applyNg(sut.resList);
				//exercise
				sut.revivalAllRes();
				//verify
				var res = sut.resList[0];
				expect(res.reshead.hasClass("deleted")).toEqual(false);
				expect(res.resbody.hasClass("deleted")).toEqual(false);
				expect(res.resbody.html()).toEqual($(resbody[0]).html());
			});

			it("NG処理がされていないときrevivalAllResは何もしない", function(){
				//exercise
				sut.revivalAllRes();
				//verify
				var res = sut.resList[0];
				expect(res.reshead.html()).toEqual($(reshead[0]).html());
				expect(res.resbody.html()).toEqual($(resbody[0]).html());
			});
		});

		describe("setContextMenuのテスト", function(){
			var sut;
			var reshead;
			var resbody;
			beforeEach(function(){
				reshead = [];
				resbody = [];
				reshead[0] = '<dt class="reshead"><a name="5" class="resnumhead"></a>5 ： <span class="name">ななしのよっしん</span> ：2009/01/11(日) 23:44:16 ID: b6fD7NC5x/</dt>';
				resbody[0] = '<dd class="resbody">テスト<a href="/b/a/name/1-#7" rel="nofollow" target="_blank" class="dic">&gt;&gt;7</a></dd>';
				reshead[1] = '<dt class="reshead"><a name="6" class="resnumhead"></a>6 ： <span class="name">ななしのよっしん</span> ：2009/01/11(日) 23:44:16 ID: b6fD7NC5x/</dt>';
				resbody[1] = '<dd class="resbody">テスト<a href="/b/a/name/1-#7" rel="nofollow" target="_blank" class="dic">&gt;&gt;7</a></dd>';
				var html = constructDl(reshead, resbody);
				sut = new c.ResCollection();
				sut.createResList($(html));
				sut.createResListById();
				sut.resList[0].makeIDDiv(sut.resListById);
				sut.resList[1].makeIDDiv(sut.resListById);
				var contextMenu = "<ul id='contextMenu' style='display:none;'><li>テスト</li></ul>";
				$("body").append(contextMenu);
				sut.setContextMenu();
				$("body").append("<div id='sandbox'></div>")
				for(var i = 0; i < sut.resList.length; i++){
					$("#sandbox").append(sut.resList[i].reshead);
					$("#sandbox").append(sut.resList[i].resbody);
				}
			});

			afterEach(function(){
				$("#contextMenu").remove();
				$("#sandbox").remove();
			});

			it("setContextMenuにより、.IDなどをクリックすると、contextMenuが出る", function(){
				//setUP
				var e = new $.Event("click");
				e.pageX = 50;
				e.pageY = 100;
				//exercise
				sut.resList[0].reshead.find(".ID").trigger(e);
				//vefiry
				var con = sut.resList[0].reshead.find("#contextMenu");
				expect(con.css("display")).not.toEqual("none");
				expect(con.css("left")).toEqual("50px");
				expect(con.css("top")).toEqual("100px");
			});

			it("setContextMenuによるcontextMenuは、.ID以外のところをクリックすると消える", function(){
				//setUp
				sut.resList[0].reshead.find(".ID").trigger("click");
				//exercise
				$("body").trigger("click");
				//vefiry
				var con = sut.resList[0].reshead.find("#contextMenu");
				expect(con.css("display")).toEqual("none");
			});

			it("IDをクリックした後、別のIDをクリックすると後にクリックしたものだけが残る", function(){
				//setUp
				sut.resList[0].reshead.find(".ID").trigger("click");
				var e = new $.Event("click");
				e.pageX = 50;
				e.pageY = 100;
				//exercise
				sut.resList[1].reshead.find(".ID").trigger(e);
				//vefiry
				expect(sut.resList[0].reshead.find("#contextMenu").size()).toEqual(0);
				var con = sut.resList[1].reshead.find("#contextMenu");
				expect(con.css("display")).not.toEqual("none");
				expect(con.css("left")).toEqual("50px");
				expect(con.css("top")).toEqual("100px");
			});
		});
	});

	describe("Resのテスト", function(){

		describe("IDに関する処理のテスト", function(){
			var cloneHeadAndBody = function(copingIndex, copiedIndex){
				reshead[copingIndex] = reshead[copiedIndex];
				resbody[copingIndex] = resbody[copiedIndex]
			};

			var list;
			var reshead;
			var resbody;
			var res1;
			var res2;
			var res3;
			var res4;
			var res5;
			var res6;

			beforeEach(function(){
				list = new c.ResCollection();
				reshead = [];
				resbody = [];
				reshead[0] = '<dt class="reshead"><a name="571" class="resnumhead"></a>571 ： <span class="name">ななしのよっしん</span>' +
	   						 	'：2014/03/03(月) 15:04:54 ID: qPNYanDe5D</dt>';
	   			resbody[0] = '<dd>1</dd>';
	   			reshead[1] = '<dt class="reshead"><a name="571" class="resnumhead"></a>571 ： <span class="name">ななしのよっしん</span>' +
	   						 	'：2014/03/03(月) 15:04:54 ID: emVU2va0WS</dt>';
		   			resbody[1] = '<dd>3</dd>';
	   			reshead[2] = '<dt class="reshead"><a name="571" class="resnumhead"></a>571 ： <span class="name">ななしのよっしん</span>' +
	   						 	'：2014/03/03(月) 15:04:54 ID: 7vRpsL9G6C</dt>';
	   			resbody[2] = '<dd>5</dd>';
	   			for(var i = 3; i <= 4; i++){
	   				cloneHeadAndBody(i, 1);
	   			}
	   			for(var i = 5; i<=8; i++){
	   				cloneHeadAndBody(i, 2);
		   			}

				reshead[9] = '<dt class="reshead"><a name="571" class="resnumhead"></a>571 ： <span class="name">ななしのよっしん</span>' +
	   						 	'：2014/03/03(月) 15:04:54 ID: qPNYanDe5a</dt>';
	   			resbody[9] = '<dd>1</dd>';
	   			reshead[10] = '<dt class="reshead"><a name="571" class="resnumhead"></a>571 ： <span class="name">ななしのよっしん</span>' +
	   						 	'：2014/03/03(月) 15:04:54 ID: emVU2va0Wt</dt>';
	   			resbody[10] = '<dd>3</dd>';
	   			reshead[11] = '<dt class="reshead"><a name="571" class="resnumhead"></a>571 ： <span class="name">ななしのよっしん</span>' +
	   						 	'：2014/03/03(月) 15:04:54 ID: 7vRpsL9G6r</dt>';
	   			resbody[11] = '<dd>5</dd>';
	   			cloneHeadAndBody(12, 11);
		   			var html = constructDl(reshead, resbody);
	   			list.createResList($(html));
	  			list.createResListById();
	   			res1 = list.resList[0];
	   			res2 = list.resList[1];
	   			res3 = list.resList[7];
	   			res4 = list.resList[9];
	   			res5 = list.resList[10];
	   			res6 = list.resList[12];
	   			GM_setValue("tooltipOnDicPage", true);
			});

			describe("makeIDDivのテスト", function(){

				it("classificationIDフラグが立っている時、createRes,createResListByIdの後にmakeIDDivをすると、同一IDの数と何番目か、また色分けがされる", function(){
					//serUp
		   			GM_setValue("classificationID", true);
		  			//exercise
		  			res1.makeIDDiv(list.resListById);
		  			res2.makeIDDiv(list.resListById);
		  			res3.makeIDDiv(list.resListById);
		  			//verify
		  			expect(res1.reshead.html()).not.toMatch(/\[/);
		  			expect(res2.reshead.html()).toMatch(/\[1\/3\]/);
		  			expect(res3.reshead.html()).toMatch(/\[4\/5\]/);
		  			expect(res1.reshead.find("div").hasClass("ID")).toEqual(true);
		  			expect(res2.reshead.find("div").hasClass("IDMulti")).toEqual(true);
		  			expect(res3.reshead.find("div").hasClass("IDMany")).toEqual(true);
				});

				it("classificationIDフラグが立っていない時、createRes,createResListByIdの後にmakeIDDivをすると、IDの数は付加されず、class:IDが付加される", function(){
					//exercise
	  				res1.makeIDDiv(list.resListById);
		  			res2.makeIDDiv(list.resListById);
					res3.makeIDDiv(list.resListById);
					//verify
					expect(res1.reshead.html()).not.toMatch(/\[/);
			 		expect(res2.reshead.html()).not.toMatch(/\[/);
			 		expect(res3.reshead.html()).not.toMatch(/\[/);
			  		expect(res1.reshead.find("div").hasClass("ID")).toEqual(true);
			  		expect(res2.reshead.find("div").hasClass("ID")).toEqual(true);
			  		expect(res3.reshead.find("div").hasClass("ID")).toEqual(true);		
		  		});

				it("classificationIDフラグが立っていても、tooltipOnDicPageがfalseで記事ページならば、IDの数は付加されず、class:IDが付加される", function(){
					//exercise
					GM_setValue("classificationID", true);
					GM_setValue("tooltipOnDicPage", false);
					spyOn(list.urlAnalyzer, "inArticlePage").and.returnValue(true);
	  				res1.makeIDDiv(list.resListById);
		  			res2.makeIDDiv(list.resListById);
					res3.makeIDDiv(list.resListById);
					//verify
					expect(res1.reshead.html()).not.toMatch(/\[/);
			 		expect(res2.reshead.html()).not.toMatch(/\[/);
			 		expect(res3.reshead.html()).not.toMatch(/\[/);
			  		expect(res1.reshead.find("div").hasClass("ID")).toEqual(true);
			  		expect(res2.reshead.find("div").hasClass("ID")).toEqual(true);
			  		expect(res3.reshead.find("div").hasClass("ID")).toEqual(true);		
		  		});

		  		it("classificationIDフラグが立っていて、tooltipOnDicPageがfalseで掲示板ページならば、同一IDの数と何番目か、また色分けがされる", function(){
					//exercise
					GM_setValue("classificationID", true);
					GM_setValue("tooltipOnDicPage", false);
					spyOn(list.urlAnalyzer, "inArticlePage").and.returnValue(false);
	  				res1.makeIDDiv(list.resListById);
		  			res2.makeIDDiv(list.resListById);
					res3.makeIDDiv(list.resListById);
					//verify
		  			expect(res1.reshead.html()).not.toMatch(/\[/);
		  			expect(res2.reshead.html()).toMatch(/\[1\/3\]/);
		  			expect(res3.reshead.html()).toMatch(/\[4\/5\]/);
		  			expect(res1.reshead.find("div").hasClass("ID")).toEqual(true);
		  			expect(res2.reshead.find("div").hasClass("IDMulti")).toEqual(true);
		  			expect(res3.reshead.find("div").hasClass("IDMany")).toEqual(true);		
		  		});

				it("classificationIDフラグを折った時、IDの数は付加されず、class:IDが付加される", function(){
					//serUp
		   			GM_setValue("classificationID", true);
		  			res1.makeIDDiv(list.resListById);
		  			res2.makeIDDiv(list.resListById);
		  			res3.makeIDDiv(list.resListById);
		  			GM_setValue("classificationID", false);
		  			//exercise
		  			res1.makeIDDiv(list.resListById);
		  			res2.makeIDDiv(list.resListById);
		  			res3.makeIDDiv(list.resListById);
		  			//verify
					expect(res1.reshead.html()).not.toMatch(/\[/);
			 		expect(res2.reshead.html()).not.toMatch(/\[/);
			 		expect(res3.reshead.html()).not.toMatch(/\[/);
			  		expect(res1.reshead.find("div").hasClass("ID")).toEqual(true);
			  		expect(res2.reshead.find("div").hasClass("ID")).toEqual(true);
			  		expect(res3.reshead.find("div").hasClass("ID")).toEqual(true);	
				});


				it("classificationIDフラグを立て直した時、同一IDの数と何番目か、また色分けがされる", function(){
					//exercise
	  				res1.makeIDDiv(list.resListById);
		  			res2.makeIDDiv(list.resListById);
					res3.makeIDDiv(list.resListById);
					GM_setValue("classificationID", true);
					res1.makeIDDiv(list.resListById);
		  			res2.makeIDDiv(list.resListById);
		  			res3.makeIDDiv(list.resListById);
					//verify
		  			expect(res2.reshead.html()).toMatch(/\[1\/3\]/);
		  			expect(res3.reshead.html()).toMatch(/\[4\/5\]/);
		  			expect(res1.reshead.find("div").hasClass("ID")).toEqual(true);
		  			expect(res2.reshead.find("div").hasClass("IDMulti")).toEqual(true);
		  			expect(res3.reshead.find("div").hasClass("IDMany")).toEqual(true);
		  		});

		  		it("makeIDDivをした後、再度makeIDDivをすると、IDの数とclassが付け替えられる", function(){
		  			//setUp
		  			GM_setValue("classificationID", true);
		  			res1.makeIDDiv(list.resListById);
		  			res2.makeIDDiv(list.resListById);
		  			res3.makeIDDiv(list.resListById);
		   			res4.makeIDDiv(list.resListById);
		  			res5.makeIDDiv(list.resListById);
		  			res6.makeIDDiv(list.resListById);
		  			cloneHeadAndBody(13, 9);
		  			for(var i = 14; i <= 17; i++){
		  				cloneHeadAndBody(i, 10);
		  			}
		  			for(var i = 18; i <= 22; i++){
		  				cloneHeadAndBody(i, 11);
		  			}
		  			var html = "<dl>";
		  			for(var i = 0; i < reshead.length; i++){
		  				html = html + reshead[i] + resbody[i];
		  			}
		  			html = html + "</dl>";
		   			list.createResList($(html));
		   			list.createResListById();
		    		res1 = list.resList[0];
		   			res2 = list.resList[1];
		   			res3 = list.resList[7];
		   			res4 = list.resList[9];
		   			res5 = list.resList[10];
		   			res6 = list.resList[12];
		  			//exercise
		  			res1.makeIDDiv(list.resListById);
		  			res2.makeIDDiv(list.resListById);
		  			res3.makeIDDiv(list.resListById);
		   			res4.makeIDDiv(list.resListById);
		  			res5.makeIDDiv(list.resListById);
		  			res6.makeIDDiv(list.resListById);
		  			//verify
		  			expect(res1.reshead.html()).not.toMatch(/\[/);
		  			expect(res2.reshead.html()).toMatch(/\[1\/3\]/);
		  			expect(res3.reshead.html()).toMatch(/\[4\/5\]/);
		  			expect(res4.reshead.html()).toMatch(/\[1\/2\]/);
		  			expect(res5.reshead.html()).toMatch(/\[1\/5\]/);
		  			expect(res6.reshead.html()).toMatch(/\[2\/7\]/);
		  			expect(res1.reshead.find("div").hasClass("ID")).toEqual(true);
		  			expect(res2.reshead.find("div").hasClass("IDMulti")).toEqual(true);
		  			expect(res3.reshead.find("div").hasClass("IDMany")).toEqual(true);
		  			expect(res4.reshead.find("div").hasClass("IDMulti")).toEqual(true);
		  			expect(res5.reshead.find("div").hasClass("IDMany")).toEqual(true);
		  			expect(res6.reshead.find("div").hasClass("IDMany")).toEqual(true);
		  		});
			});

			describe("makeIDTooltipのテスト", function(){
				beforeEach(function(){
					//setUp
					GM_setValue("classificationID", true);
					res2.makeIDDiv(list.resListById);
				});

				it("createResList、createResListById、の後にmakeIDTooltipをすると、mouseenterイベントでツールチップが出る", function(){
					//exercise
					res2.makeIDTooltip(list.resListById);
					res2.reshead.find("div[class^='ID']").trigger("mouseenter");
					//verify
					expect(res2.reshead.find("div[class^='ID'] > div").size()).toEqual(1);
					expect(res2.reshead.find("div[class^='ID'] > div .reshead").size()).toEqual(3);
				});

				it("mouseenterで出たツールチップがmouseleaveで消える", function(){
					//setUp
					res2.makeIDTooltip(list.resListById);
					res2.reshead.find("div[class^='ID']").trigger("mouseenter");
					//exercise
					res2.reshead.find("div[class^='ID']").trigger("mouseleave");
					//verify
					expect(res2.reshead.find("div[class^='ID'] > div").size()).toEqual(0);
				});

				it("二度makeIDTooltipをしてもmouseenterで一つだけツールチップが出る", function(){
					//exercise
					res2.makeIDTooltip(list.resListById);
					res2.makeIDTooltip(list.resListById);
					res2.reshead.find("div[class^='ID']").trigger("mouseenter");
					//verify
					expect(res2.reshead.find("div[class^='ID'] > div").size()).toEqual(1);
					expect(res2.reshead.find("div[class^='ID'] > div .reshead").size()).toEqual(3);
				});
			});
		});

		describe("レス番に関するテスト", function(){
			var reshead;
			var resbody;
			var list;
			var res;

			beforeEach(function(){
				reshead = [];
				resbody = [];
				res = [];
				reshead[0] = '<dt class="reshead"><a name="1" class="resnumhead"></a>1 ： <span class="name">ななしのよっしん</span> ：2009/01/11(日) 23:44:16 ID: b6fD7NC5x/</dt>';
				resbody[0] = '<dd class="resbody"><a href="/b/a/name/1-#2" rel="nofollow" target="_blank" class="dic">&gt;&gt;2-3</a></dd>';
				reshead[1] = '<dt class="reshead"><a name="2" class="resnumhead"></a>2 ： <span class="name">ななしのよっしん</span> ：2009/01/11(日) 23:44:16 ID: b6fD7NC5x/</dt>';
				resbody[1] = '<dd class="resbody"><a href="/b/a/name/1-#3" rel="nofollow" target="_blank" class="dic">&gt;&gt;3</a></dd>';
				reshead[2] = '<dt class="reshead"><a name="3" class="resnumhead"></a>3 ： <span class="name">ななしのよっしん</span> ：2009/01/11(日) 23:44:16 ID: b6fD7NC5x/</dt>';
				resbody[2] = '<dd class="resbody"><a href="/b/a/name/1-#3" rel="nofollow" target="_blank" class="dic">&gt;&gt;3</a>' + 
								'<a href="/b/a/name/1-#2" rel="nofollow" target="_blank" class="dic">&gt;&gt;2</a>' + 
								'<a href="/b/a/name/1-#2" rel="nofollow" target="_blank" class="dic">&gt;&gt;2</a></dd>';
				reshead[3] = '<dt class="reshead"><a name="4" class="resnumhead"></a>4 ： <span class="name">ななしのよっしん</span> ：2009/01/11(日) 23:44:16 ID: b6fD7NC5x/</dt>';
				resbody[3] = '<dd class="resbody"><a href="/b/a/name/1-#2" rel="nofollow" target="_blank" class="dic">&gt;&gt;2-4</a></dd>';
		 		var html = constructDl(reshead, resbody);
		 		list = new c.ResCollection();
		 		list.createResList($(html));
		 		res[0] = list.resList[0];
		 		res[1] = list.resList[1];
		 		res[2] = list.resList[2];
		 		res[3] = list.resList[3];
			});

			describe("makeNumberDivのテスト", function(){

				it("classificationResNumberフラグが立っている時、createIDの後makeNumberDivをすると、リンクされているレスの番号に下線、及び色分けがされる", function(){
					//setUp
			 		GM_setValue("classificationResNumber", true);
			 		//exsecise
			 		res[0].makeNumberDiv(list.resList);
			 		res[1].makeNumberDiv(list.resList);
			 		res[2].makeNumberDiv(list.resList);
			 		res[3].makeNumberDiv(list.resList);
			 		//verify
			 		expect(res[0].reshead.find("div").size()).toEqual(0);
			 		expect(res[1].reshead.find("div").hasClass("NumberMulti")).toEqual(true);
			 		expect(res[2].reshead.find("div").hasClass("NumberMany")).toEqual(true);
			 		expect(res[3].reshead.find("div").hasClass("Number")).toEqual(true);
				});

				it("classificationResNumberフラグが立っている時、createIDの後makeNumberDivをすると、リンクされているレスの番号に下線はひかれるが、色分けはされない", function(){
					//setUp
			 		//exsecise
			 		res[0].makeNumberDiv(list.resList);
			 		res[1].makeNumberDiv(list.resList);
			 		res[2].makeNumberDiv(list.resList);
			 		res[3].makeNumberDiv(list.resList);
			 		//verify
			 		expect(res[0].reshead.find("div").size()).toEqual(0);
			 		expect(res[1].reshead.find("div").hasClass("Number")).toEqual(true);
			 		expect(res[2].reshead.find("div").hasClass("Number")).toEqual(true);
			 		expect(res[3].reshead.find("div").hasClass("Number")).toEqual(true);
				});

				it("makeNumberDivをしなおしても、下線、色分けはなされる", function(){
					//setUp
					GM_setValue("classificationResNumber", true);
					reshead[4] = '<dt class="reshead"><a name="5" class="resnumhead"></a>5 ： <span class="name">ななしのよっしん</span> ：2009/01/11(日) 23:44:16 ID: b6fD7NC5x/</dt>';
					resbody[4] = '<dd class="resbody"><a href="/b/a/name/1-#2" rel="nofollow" target="_blank" class="dic">&gt;&gt;7</a></dd>';
					reshead[5] = '<dt class="reshead"><a name="6" class="resnumhead"></a>6 ： <span class="name">ななしのよっしん</span> ：2009/01/11(日) 23:44:16 ID: b6fD7NC5x/</dt>';
					resbody[5] = '<dd class="resbody"><a href="/b/a/name/1-#2" rel="nofollow" target="_blank" class="dic">&gt;&gt;2</a></dd>';
					var html = constructDl(reshead, resbody);
					list = new c.ResCollection();
			 		list.createResList($(html));
			 		//exercise
			 		res[0].makeNumberDiv(list.resList);
			 		res[1].makeNumberDiv(list.resList);
			 		res[2].makeNumberDiv(list.resList);
			 		res[3].makeNumberDiv(list.resList);
			 		//verify
			 		expect(res[0].reshead.find("div").size()).toEqual(0);
			 		expect(res[1].reshead.find("div").hasClass("NumberMany")).toEqual(true);
			 		expect(res[2].reshead.find("div").hasClass("NumberMany")).toEqual(true);
			 		expect(res[3].reshead.find("div").hasClass("Number")).toEqual(true);
				});
			});

			describe("makeLinkedNumberTooltipのテスト", function(){
				it("makeNumberDivの後にmakeLinkedNumberTooltipをすると、mouseenterでツールチップが出る", function(){
					//setUp
			 		res[0].makeNumberDiv(list.resList);
			 		res[1].makeNumberDiv(list.resList);
			 		res[2].makeNumberDiv(list.resList);
			 		res[3].makeNumberDiv(list.resList);
			 		//exercise
			 		for(var i = 0; i < res.length; i++){
			 			res[i].makeLinkedNumberTooltip();
			 			res[i].reshead.find("div[class^='Number']").trigger("mouseenter");
			 		}
			 		//verify
			 		expect(res[0].reshead.find("div[class^='Number'] div:not([class^='Number'])").size()).toEqual(0);
			 		expect(res[1].reshead.find("div[class^='Number'] div:not([class^='Number'])").size()).toEqual(1);
			 		expect(res[1].reshead.find("div[class^='Number'] div:not([class^='Number']) .reshead").size()).toEqual(3);
				});

				it("mouseenterで出たツールチップがmouseleaveで消える", function(){
					//setUp
			 		res[0].makeNumberDiv(list.resList);
			 		res[1].makeNumberDiv(list.resList);
			 		res[2].makeNumberDiv(list.resList);
			 		res[3].makeNumberDiv(list.resList);
			 		//exercise
			 		for(var i = 0; i < res.length; i++){
			 			res[i].makeLinkedNumberTooltip();
			 			res[i].reshead.find("div[class^='Number']").trigger("mouseenter");
			 			res[i].reshead.find("div[class^='Number']").trigger("mouseleave");
			 		}
			 		//verify
			 		expect(res[0].reshead.find("div[class^='Number'] div:not([class^='Number'])").size()).toEqual(0);
			 		expect(res[1].reshead.find("div[class^='Number'] div:not([class^='Number'])").size()).toEqual(0);
				});
			});
		});

		describe("makeNumTooltipのテスト", function(){
			var reshead;
			var resbody;
			var res;
			beforeEach(function(){
				reshead = [];
				resbody = [];
				res = [];
				reshead[0] = '<dt class="reshead"><a name="31" class="resnumhead"></a>31 ： <span class="name">ななしのよっしん</span> ：2009/01/11(日) 23:44:16 ID: b6fD7NC5x/</dt>';
				resbody[0] = '<dd class="resbody"><a href="/b/a/name/1-#4" rel="nofollow" target="_blank" class="dic">&gt;&gt;4</a></dd>';
				reshead[1] = '<dt class="reshead"><a name="32" class="resnumhead"></a>32 ： <span class="name">ななしのよっしん</span> ：2009/01/11(日) 23:44:16 ID: b6fD7NC5x/</dt>';
				resbody[1] = '<dd class="resbody"><a href="/b/a/name/31-#31" rel="nofollow" target="_blank" class="dic">&gt;&gt;31</a></dd>';
				reshead[2] = '<dt class="reshead"><a name="33" class="resnumhead"></a>33 ： <span class="name">ななしのよっしん</span> ：2009/01/11(日) 23:44:16 ID: b6fD7NC5x/</dt>';
				resbody[2] = '<dd class="resbody"><a href="/b/a/name/31-#31" rel="nofollow" target="_blank" class="dic">&gt;&gt;31-32</a></dd>';
				reshead[3] = '<dt class="reshead"><a name="34" class="resnumhead"></a>34 ： <span class="name">ななしのよっしん</span> ：2009/01/11(日) 23:44:16 ID: b6fD7NC5x/</dt>';
				resbody[3] = '<dd class="resbody"><a href="/b/a/name/31-#34" rel="nofollow" target="_blank" class="dic">&gt;&gt;34</a></dd>';
				var html = constructDl(reshead, resbody);
				list = new c.ResCollection();
				list.createResList($(html));
				list.createResListByNumber();
				for(var i = 0; i < list.resList.length; i++){
					res[i] = list.resList[i];
					res[i].makeNumTooltip(list.resListByNumber);
				}
			});

			it("createResListの後makeNumTooltipをしても、参照先がないならばmouseenterでツールチップがでない", function(){
				//exercise
				res[0].resbody.find("a.dic").trigger("mouseenter");
				//verify
				expect(res[0].resbody.find("span.numTooltip div").size()).toEqual(0);
				//tearDown
				res[0].resbody.find("a.dic").trigger("mouseleave");
			});

			it("createResListの後makeNumTooltipをすると、mouseenterで参照先のツールチップが出る", function(){
				//exercise
				res[1].resbody.find("a.dic").trigger("mouseenter");
				//verify
				expect(res[1].resbody.find("span.numTooltip div").size()).toEqual(1);
				expect(res[1].resbody.find("span.numTooltip div .reshead").size()).toEqual(1);
				//tearDown
				res[1].resbody.find("a.dic").trigger("mouseleave");
			});

			it("makeNumToolTipをした状態で、mouseenterをした後mouseleaveすればツールチップは消える", function(){
				//setUp
				res[1].resbody.find("a.dic").trigger("mouseenter");
				//exercise
				res[1].resbody.find("a.dic").trigger("mouseleave");
				//verify
				expect(res[1].resbody.find("span.numTooltip div").size()).toEqual(0);
			});

			it("createResListの後makeNumTooltipをすると、mouseenterで参照先の範囲のツールチップが出る", function(){
				//exercise
				res[2].resbody.find("a.dic").trigger("mouseenter");
				//verify
				expect(res[2].resbody.find("span.numTooltip div").size()).toEqual(1);
				expect(res[2].resbody.find("span.numTooltip div .reshead").size()).toEqual(2);
				//tearDown
				res[2].resbody.find("a.dic").trigger("mouseleave");
			});

			it("createResList後makeNumTooltipをすると、自分へのレスにmouseenterすることで自分のレスがツールチップで出る", function(){
				//exercise
				res[3].resbody.find("a.dic").trigger("mouseenter");
				//verify
				expect(res[3].resbody.find("span.numTooltip div").size()).toEqual(1);
				expect(res[3].resbody.find("span.numTooltip div .reshead").size()).toEqual(1);
				//tearDown
				res[3].resbody.find("a.dic").trigger("mouseleave");
			});
		});

		describe("makeNumberHandleTooltipのテスト", function(){
			var reshead;
			var resbody;
			var res;
			var list;
			beforeEach(function(){
				reshead = [];
				resbody = [];
				res = [];
				reshead[0] = '<dt class="reshead"><a name="31" class="resnumhead"></a>31 ： <span class="name">ななしのよっしん</span> ：2009/01/11(日) 23:44:16 ID: b6fD7NC5x/</dt>';
				resbody[0] = '<dd class="resbody"><a href="/b/a/name/1-#4" rel="nofollow" target="_blank" class="dic">&gt;&gt;4</a></dd>';
				reshead[1] = '<dt class="reshead"><a name="32" class="resnumhead"></a>32 ： <span class="name">1</span> ：2009/01/11(日) 23:44:16 ID: b6fD7NC5x/</dt>';
				resbody[1] = '<dd class="resbody"><a href="/b/a/name/31-#31" rel="nofollow" target="_blank" class="dic">&gt;&gt;31</a></dd>';
				reshead[2] = '<dt class="reshead"><a name="33" class="resnumhead"></a>33 ： <span class="name">31</span> ：2009/01/11(日) 23:44:16 ID: b6fD7NC5x/</dt>';
				resbody[2] = '<dd class="resbody"><a href="/b/a/name/31-#31" rel="nofollow" target="_blank" class="dic">&gt;&gt;31-32</a></dd>';
				reshead[3] = '<dt class="reshead"><a name="33" class="resnumhead"></a>３３ ： <span class="name">31</span> ：2009/01/11(日) 23:44:16 ID: b6fD7NC5x/</dt>';
				resbody[3] = '<dd class="resbody"><a href="/b/a/name/31-#31" rel="nofollow" target="_blank" class="dic">&gt;&gt;31-32</a></dd>';
				var html = constructDl(reshead, resbody);
				list = new c.ResCollection();
				list.createResList($(html));
				list.createResListByNumber();
				for(var i = 0; i < list.resList.length; i++){
					res[i] = list.resList[i];
				}
			});

			it("createResListの後makeNumberHandleTooltipをすれば、ハンドルにmouseenterでハンドルのツールチップが出る", function(){
				//exercise
				for(var i = 0; i < list.resList.length; i++){
					res[i].makeNumberHandleTooltip(list.resListByNumber);
					res[i].reshead.find("span.NumberHandle").trigger("mouseenter");
				}
				//verify
				expect(res[0].reshead.find("span.NumberHandle div").size()).toEqual(0);
				expect(res[1].reshead.find("span.NumberHandle div").size()).toEqual(0);
				expect(res[2].reshead.find("span.NumberHandle div").size()).toEqual(1);
				expect(res[3].reshead.find("span.NumberHandle div").size()).toEqual(1);
			});

			it("mouseenterで出たツールチップがmouseleaveで消える", function(){
				//exercise
				for(var i = 0; i < list.resList.length; i++){
					res[i].makeNumberHandleTooltip(list.resListByNumber);
					res[i].reshead.find("span.NumberHandle").trigger("mouseenter");
					res[i].reshead.find("span.NumberHandle").trigger("mouseleave");
				}
				//verify
				expect(res[0].reshead.find("span.NumberHandle div").size()).toEqual(0);
				expect(res[1].reshead.find("span.NumberHandle div").size()).toEqual(0);
				expect(res[2].reshead.find("span.NumberHandle div").size()).toEqual(0);
				expect(res[3].reshead.find("span.NumberHandle div").size()).toEqual(0);
			});
		});

		describe("backupResのテスト", function(){

			it("backupResを実行するとtrueResheadとtrueResbodyが作られる", function(){
				//setUp
				var reshead = [];
				var resbody = [];
				var res = [];
				reshead[0] = '<dt class="reshead"><a name="31" class="resnumhead"></a>31 ： <span class="name">ななしのよっしん</span> ：2009/01/11(日) 23:44:16 ID: b6fD7NC5x/</dt>';
				resbody[0] = '<dd class="resbody"><a href="/b/a/name/1-#4" rel="nofollow" target="_blank" class="dic">&gt;&gt;4</a></dd>';
				var html = constructDl(reshead, resbody);
				var list = new c.ResCollection();
				list.createResList($(html));
				var r = list.resList[0];
				headHtml = r.reshead.html();
				bodyHtml = r.resbody.html();
				//exercise
				r.backupRes();
				//verify
				expect(r.trueReshead.html()).toEqual(headHtml);
				expect(r.trueResbody.html()).toEqual(bodyHtml);
			});
		});

		describe("changeLinkのテスト", function(){
			var reshead;
			var resbody;
			var urlAnalyzer;
			beforeEach(function(){
				reshead = $('<dt class="reshead"><a name="32" class="resnumhead"></a>32 ： <span class="name">NGネーム</span> ：2009/01/11(日) 23:44:16 ID: b6fD7NC5x/</dt>');
				resbody = $('<dd class="resbody"><a href="/b/a/name/31-#32" rel="nofollow" target="_blank" class="dic">&gt;&gt;32</a></dd>');
				urlAnalyzer = new c.UrlAnalyzer();
			});

			it("記事ページではリンク先を変更せず、同じタブで飛ぶようにする", function(){
				//setUp
				spyOn(urlAnalyzer, "getNowUrl").and.returnValue("http://dic.nicovideo.jp/a/name");
				var sut = new c.Res(reshead, resbody, urlAnalyzer);
				//exercise
				sut.changeLink();
				//verify
				expect(sut.resbody.find("a.dic").attr("href")).toMatch(/\/b\/a\/name\/31-#32/);
				expect(sut.resbody.find("a.dic").attr("target")).toBeUndefined();
			});

			it("掲示板ページでリンク先と同じページの時、リンク先を変更せず、同じタブで飛ぶようにする", function(){
				//setUp
				spyOn(urlAnalyzer, "getNowUrl").and.returnValue("http://dic.nicovideo.jp/b/a/name/31-");
				var sut = new c.Res(reshead, resbody, urlAnalyzer);
				//exercise
				sut.changeLink();
				//verify
				expect(sut.resbody.find("a.dic").attr("href")).toMatch(/\/b\/a\/name\/31-#32/);
				expect(sut.resbody.find("a.dic").attr("target")).toBeUndefined();
			});

			it("掲示板ページでリンク先と違うページの時、現在のページにリンク先を変更して、同じタブで飛ぶようにする", function(){
				//setUp
				spyOn(urlAnalyzer, "getNowUrl").and.returnValue("http://dic.nicovideo.jp/b/a/name/1-");
				var sut = new c.Res(reshead, resbody, urlAnalyzer);
				//exercise
				sut.changeLink();
				//verify
				expect(sut.resbody.find("a.dic").attr("href")).toMatch(/\/b\/a\/name\/1-#32/);
				expect(sut.resbody.find("a.dic").attr("target")).toBeUndefined();
			});

			it('掲示板ページでリンク先が違う記事のページの場合、変更しない', function(){
				//setUp
				spyOn(urlAnalyzer, "getNowUrl").and.returnValue("http://dic.nicovideo.jp/b/a/name/1-");
				resbody =$('<dd class="resbody"><a href="http://dic.nicovideo.jp/u/1" rel="nofollow" target="_blank" class="dic">http://d<wbr>ic.nicov<wbr>ideo.jp/<wbr>u/1</a></dd>');
				var sut = new c.Res(reshead, resbody, urlAnalyzer);
				//exercise
				sut.changeLink();
				//verify
				expect(sut.resbody.find('a.dic').attr('href')).toEqual('http://dic.nicovideo.jp/u/1');
				expect(sut.resbody.find('a.dic').attr('target')).toEqual('_blank');
			});
		});
	});

	describe("NgOperatorのテスト", function(){
		describe("initNgのテスト", function(){
			var sut;

			beforeEach(function(){
				sut = new c.NgOperator();
				spyOn(c, "removeUselessLines").and.callFake(function(v){
					return v;
				});
			});

			it("ngがGMに登録されている時、それをngListに配列として登録する", function(){
				//setUp
				var ngid = ["ngid1", "ngid2"];
				var ngname = ["ngname1", "ngname2"];
				var ngword = ["ngword1", "ngword2"];
				var ngres = ["ngres1", "ngres2"];
				GM_setValue("ngid", ngid.join("\n"));
				GM_setValue("ngname", ngname.join("\n"));
				GM_setValue("ngword", ngword.join("\n"));
				GM_setValue("ngres", ngres.join("\n"));
				//exercise
				sut.initNg();
				//verify
				expect(sut.ngList.ngid).toEqual(ngid);
				expect(sut.ngList.ngname).toEqual(ngname);
				expect(sut.ngList.ngword).toEqual(ngword);
				expect(sut.ngList.ngres).toEqual(ngres);
			})

			it("ngがGMに登録されていない時、ngListの配列は空の配列になる", function(){
				//exercise
				sut.initNg();
				//verify
				expect(sut.ngList.ngid).toEqual([]);
				expect(sut.ngList.ngname).toEqual([]);
				expect(sut.ngList.ngword).toEqual([]);
				expect(sut.ngList.ngres).toEqual([]);
			});
		});

		describe("applyNgのテスト", function(){
			var sut;
			var reshead;
			var resbody;
			var res;
			var list;
			beforeEach(function(){
				sut = new c.NgOperator();
				reshead = [];
				resbody = [];
				res = [];
				reshead[0] = '<dt class="reshead"><a name="31" class="resnumhead"></a>31 ： <span class="name">ななしのよっしん</span> ：2009/01/11(日) 23:44:16 ID: b6fD7NC5ng</dt>';
				resbody[0] = '<dd class="resbody">NGID</dd>';
				reshead[1] = '<dt class="reshead"><a name="32" class="resnumhead"></a>32 ： <span class="name">NGネーム</span> ：2009/01/11(日) 23:44:16 ID: b6fD7NC5x/</dt>';
				resbody[1] = '<dd class="resbody">NGネーム</dd>';
				reshead[2] = '<dt class="reshead"><a name="33" class="resnumhead"></a>33 ： <span class="name">ななしのよっしん</span> ：2009/01/11(日) 23:44:16 ID: b6fD7NC5x/</dt>';
				resbody[2] = '<dd class="resbody">NGワード</dd>';
				reshead[3] = '<dt class="reshead"><a name="34" class="resnumhead"></a>34 ： <span class="name">31</span> ：2009/01/11(日) 23:44:16 ID: b6fD7NC5x/</dt>';
				resbody[3] = '<dd class="resbody">NGレス</dd>';
				var html = constructDl(reshead, resbody);
				list = new c.ResCollection();
				list.createResList($(html));
				for(var i = 0; i < list.resList.length; i++){
					list.resList[i].backupRes();
					res[i] = list.resList[i];
				}
				sut.ngList.ngid = ["b6fD7NC5ng"];
				sut.ngList.ngname = ["Gネーム"];
				sut.ngList.ngword = ["NGワード"];
				sut.ngList.ngres = ["http://dic.nicovideo.jp/a/ngres:34"];
				spyOn(sut.urlAnalyzer, "isPageOf").and.returnValue(true);
				var style = "<style id='nicoDicBBSViewerCSS' type='text/css'></style>";
				$("link").last().after(style);
			});

			afterEach(function(){
				$("#nicoDicBBSViewerCSS").remove();
			});

			describe("ngの適応に関するテスト", function(){
				it("useNGフラグが立っている時、NGが適応される", function(){
					//setUp
					GM_setValue("useNG", true);
					//exercise
					sut.applyNg(list.resList);
					//verify
					for(var i = 0; i < list.resList.length; i++){
						expect(list.resList[i].reshead.hasClass("deleted")).toEqual(true);
						expect(list.resList[i].resbody.hasClass("deleted")).toEqual(true);
						expect(list.resList[i].reshead.html()).toMatch('<span class="name">削除しました</span>');
						expect(list.resList[i].resbody.html()).toEqual("削除しました");
					}
				});

				it("useNGフラグが経っていない時、NGが適応されない", function(){
					//setUp
					//exercise
					sut.applyNg(list.resList);
					//verify
					for(var i = 0; i < list.resList.length; i++){
						expect(list.resList[i].reshead.hasClass("deleted")).toEqual(false);
						expect(list.resList[i].resbody.hasClass("deleted")).toEqual(false);
						expect(list.resList[i].reshead.html()).not.toMatch('<span class="name">削除しました</span>');
						expect(list.resList[i].resbody.html()).not.toEqual("削除しました");
					}
				});

				it("useNGフラグを折った時、NGが適応されない", function(){
					//setUp
					GM_setValue("useNG", true);
					sut.applyNg(list.resList);
					GM_setValue("useNG", false);
					//exercise
					sut.applyNg(list.resList);
					//verify
					for(var i = 0; i < list.resList.length; i++){
						expect(list.resList[i].reshead.hasClass("deleted")).toEqual(false);
						expect(list.resList[i].resbody.hasClass("deleted")).toEqual(false);
						expect(list.resList[i].reshead.html()).not.toMatch('<span class="name">削除しました</span>');
						expect(list.resList[i].resbody.html()).not.toEqual("削除しました");
					}
				});

				it("useNGフラグを立て直した時、NGは適応される", function(){
					//setUp
					sut.applyNg(list.resList);
					GM_setValue("useNG", true);
					//exercise
					sut.applyNg(list.resList);
					//verify
					for(var i = 0; i < list.resList.length; i++){
						expect(list.resList[i].reshead.hasClass("deleted")).toEqual(true);
						expect(list.resList[i].resbody.hasClass("deleted")).toEqual(true);
						expect(list.resList[i].reshead.html()).toMatch('<span class="name">削除しました</span>');
						expect(list.resList[i].resbody.html()).toEqual("削除しました");
					}
				})
			});

			describe("不可視化のテスト", function(){
				beforeEach(function(){
					GM_setValue("useNG", true);
				})

				it("seethroughNGフラグが立っているとき、display:noneになる", function(){
					//setUp
					GM_setValue("seethroughNG", true);
					//exercise
					sut.applyNg(list.resList);
					//verify
					expect(list.resList[0].reshead.css("display")).toEqual("none");
					expect(list.resList[0].resbody.css("display")).toEqual("none");
				});

				it("seethroughNGフラグが立っていない時、display:noneにならない", function(){
					//setUp
					//exercise
					sut.applyNg(list.resList);
					//verify
					expect(list.resList[0].reshead.css("display")).not.toEqual("none");
					expect(list.resList[0].resbody.css("display")).not.toEqual("none");
				});

				it("seethroughNGフラグを折った時、display:noneにならない", function(){
					//setUp
					GM_setValue("seethroughNG", true);
					sut.applyNg(list.resList);
					GM_setValue("seethroughNG", false);
					//exercise
					sut.applyNg(list.resList);
					//verify
					expect(list.resList[0].reshead.css("display")).not.toEqual("none");
					expect(list.resList[0].resbody.css("display")).not.toEqual("none");
				});

				it("seethroughNGフラグを立て直した時、display:noneになる", function(){
					//setUp
					sut.applyNg(list.resList);
					GM_setValue("seethroughNG", true);
					//exercise
					sut.applyNg(list.resList);
					//verify
					expect(list.resList[0].reshead.css("display")).toEqual("none");
					expect(list.resList[0].resbody.css("display")).toEqual("none");
				});
			});
		});
	});

	describe("ManagerToReadBbsのテスト", function(){
		var sut;
		var urls;
		var basicUrl
		var urlAnalyzer;
		beforeEach(function(){
			urlAnalyzer = new c.UrlAnalyzer();
			basicUrl = "http://dic.nicovideo.jp/b/a/bbs/";
			urls = [];
			$("body").append("<div id='sandbox'></div>");
			$("head").append("<style id='nicoDicBBSViewerCSS'></style>");
		});

		afterEach(function(){
			$("#sandbox").remove();
			$("#nicoDicBBSViewerCSS").remove();
		})

		describe("コンストラクタのテスト", function(){
			it("コンストラクタでbbsUrls、startIndex、endIndex、isNowLoadingが定義される", function(){
				//exercise
				for(var i = 0; i < 3; i++){
					urls[i] = basicUrl + (30 * i + 1) + "-";
				}
				spyOn(urlAnalyzer, "getNowUrl").and.returnValue(basicUrl + "31-");
				sut = new c.ManagerToReadBbs(urls, urlAnalyzer);
				//verify
				for(var i = 0; i < urls.length; i++){
					expect(sut.bbsUrls[i]).toEqual(urls[i]);
				}
				expect(sut.startIndex).toEqual(1);
				expect(sut.endIndex).toEqual(1);
				expect(sut.isNowLoading).toEqual(false);
			});
		});

		describe("initPagerのテスト", function(){

			describe('addToOnePageがtrueのとき', function(){
				beforeEach(function(){
					GM_setValue('addToOnePage', true);
				});

				describe("掲示板が3ページあるとき", function(){

					beforeEach(function(){
						for(var i = 0; i < 3; i++){
							urls[i] = basicUrl + (30 * i + 1) + "-";
						}
					});

					it("記事ページでは、.naviが消える", function(){
						//setUp
						var nowUrl = "http://dic.nicovideo.jp/a/bbs";
						spyOn(urlAnalyzer, "getNowUrl").and.returnValue(nowUrl);
						sut = new c.ManagerToReadBbs(urls, urlAnalyzer);
						var divHead = '<div class="pager">';
						var navi = '<a href="/a/bbs" class="navi">-bbsの記事へ戻る-</a><a href="/b/a/bbs/31-" class="navi">&#171; 前へ</a>';
						var pager = '<a href="/b/a/bbs/1-">1-</a><a href="/b/a/bbs/31-">31-</a><a href="/b/a/bbs/61-">61-</a>';
						var divTail = "</div>";
						$("#sandbox").append('<div id="bbs">' + divHead + navi + pager + divTail + divHead + navi + pager + divTail + '</div>');
						//exercise
						sut.initPager();
						//verify
						expect($(".pager").eq(0).html()).toEqual($(divHead + pager + divTail).html());
						expect($(".pager").eq(1).html()).toEqual($(divHead + pager + divTail).html());
					});

					it("掲示板ページで中間のページの時、上は記事へのリンクと掲示板の前のページを呼び出す前へのリンクが、下は記事へのリンクと掲示板の次のページを呼び出す次へのリンクが出来る", function(){
						//setUp
						var nowUrl = "http://dic.nicovideo.jp/b/a/bbs/31-";
						spyOn(urlAnalyzer, "getNowUrl").and.returnValue(nowUrl);
						sut = new c.ManagerToReadBbs(urls, urlAnalyzer);
						spyOn(sut, "readPreviousBbs");
						spyOn(sut, "readNextBbs");
						var divHead = '<div class="pager">'
						var navi1 = '<a href="/a/bbs" class="navi">-bbsの記事へ戻る-</a><a href="/b/a/bbs/1-" class="navi">&#171; 前へ</a>';
						var pager = '<a href="/b/a/bbs/1-">1-</a><span class="current">31-</span><a href="/b/a/bbs/61-">61-</a>';
						var navi2 = '<a href="/b/a/bbs/61-" class="navi">次へ &#187;</a>';
						var divTail = '</div>';
						$("#sandbox").append('<div id="bbs">' + divHead + navi1 + pager + navi2 + divTail + divHead + navi1 + pager + navi2 + divTail + '</div>');
						//exeicise
						sut.initPager();
						//verify
						expect($(".pager").eq(0).find("a").size()).toEqual(2);
						expect($(".pager").eq(0).find("a").eq(0).html()).toEqual("-bbsの記事へ戻る-");
						expect($(".pager").eq(0).find("a").eq(1).html()).toEqual("前へ");
						expect($(".pager").eq(1).find("a").size()).toEqual(2);
						expect($(".pager").eq(1).find("a").eq(0).html()).toEqual("-bbsの記事へ戻る-");
						expect($(".pager").eq(1).find("a").eq(1).html()).toEqual("次へ");
						expect(sut.readPreviousBbs).not.toHaveBeenCalled();
						$("#loadPreviousPageLinks").trigger("click");
						expect(sut.readPreviousBbs).toHaveBeenCalled();
						expect(sut.readNextBbs).not.toHaveBeenCalled();
						$("#loadNextPageLinks").trigger("click");
						expect(sut.readNextBbs).toHaveBeenCalled();
					});

					it("掲示板ページで最初のページの時、上は記事へのリンクが、下は記事へのリンクと掲示板の次のページを呼び出す次へのリンクが出来る", function(){
						//setUp
						var nowUrl = "http://dic.nicovideo.jp/b/a/bbs/1-";
						spyOn(urlAnalyzer, "getNowUrl").and.returnValue(nowUrl);
						sut = new c.ManagerToReadBbs(urls, urlAnalyzer);
						spyOn(sut, "readPreviousBbs");
						spyOn(sut, "readNextBbs");
						var divHead = '<div class="pager">'
						var navi1 = '<a href="/a/bbs" class="navi">-bbsの記事へ戻る-</a>';
						var pager = '<span class="current">1-</span><a href="/b/a/bbs/31-">31-</a><a href="/b/a/bbs/61-">61-</a>';
						var navi2 = '<a href="/b/a/bbs/31-" class="navi">次へ &#187;</a>';
						var divTail = '</div>';
						$("#sandbox").append('<div id="bbs">' + divHead + navi1 + pager + navi2 + divTail + divHead + navi1 + pager + navi2 + divTail + '</div>');
						//exeicise
						sut.initPager();
						//verify
						expect($(".pager").eq(0).find("a").size()).toEqual(1);
						expect($(".pager").eq(0).find("a").eq(0).html()).toEqual("-bbsの記事へ戻る-");
						expect($(".pager").eq(1).find("a").size()).toEqual(2);
						expect($(".pager").eq(1).find("a").eq(0).html()).toEqual("-bbsの記事へ戻る-");
						expect($(".pager").eq(1).find("a").eq(1).html()).toEqual("次へ");
						expect(sut.readNextBbs).not.toHaveBeenCalled();
						$("#loadNextPageLinks").trigger("click");
						expect(sut.readNextBbs).toHaveBeenCalled();
					});

					it("掲示板ページで最後のページの時、上は記事へのリンクと掲示板の前のページを呼び出す前へのリンクが、下は記事へのリンクが出来る", function(){
						//setUp
						var nowUrl = "http://dic.nicovideo.jp/b/a/bbs/61-";
						spyOn(urlAnalyzer, "getNowUrl").and.returnValue(nowUrl);
						sut = new c.ManagerToReadBbs(urls, urlAnalyzer);
						spyOn(sut, "readPreviousBbs");
						spyOn(sut, "readNextBbs");
						var divHead = '<div class="pager">'
						var navi1 = '<a href="/a/bbs" class="navi">-bbsの記事へ戻る-</a><a href="/b/a/bbs/31-" class="navi">&#171; 前へ</a>';
						var pager = '<a href="/b/a/bbs/1-">1-</a><a href="/b/a/bbs/31-">31-</a><span class="current">61-</span>';
						var navi2 = "";
						var divTail = '</div>';
						$("#sandbox").append('<div id="bbs">' + divHead + navi1 + pager + navi2 + divTail + divHead + navi1 + pager + navi2 + divTail + '</div>');
						//exeicise
						sut.initPager();
						//verify
						expect($(".pager").eq(0).find("a").size()).toEqual(2);
						expect($(".pager").eq(0).find("a").eq(0).html()).toEqual("-bbsの記事へ戻る-");
						expect($(".pager").eq(0).find("a").eq(1).html()).toEqual("前へ");
						expect($(".pager").eq(1).find("a").size()).toEqual(1);
						expect($(".pager").eq(1).find("a").eq(0).html()).toEqual("-bbsの記事へ戻る-");
						expect(sut.readPreviousBbs).not.toHaveBeenCalled();
						$("#loadPreviousPageLinks").trigger("click");
						expect(sut.readPreviousBbs).toHaveBeenCalled();
					});
				});

				describe("掲示板が1ページの時", function(){
					beforeEach(function(){
						urls[0] = basicUrl + "1-";
					});

					it("記事ページでは、.naviが消える", function(){
						//setUp
						var nowUrl = "http://dic.nicovideo.jp/a/bbs";
						spyOn(urlAnalyzer, "getNowUrl").and.returnValue(nowUrl);
						sut = new c.ManagerToReadBbs(urls, urlAnalyzer);
						var divHead = '<div class="pager">';
						var navi = '<a href="/a/bbs" class="navi">-bbsの記事へ戻る-</a>';
						var pager = '<a href="/b/a/bbs/1-">1-</a>';
						var divTail = "</div>";
						$("#sandbox").append('<div id="bbs">' + divHead + navi + pager + divTail + divHead + navi + pager + divTail + '</div>');
						//exercise
						sut.initPager();
						//verify
						expect($(".pager").eq(0).html()).toEqual($(divHead + pager + divTail).html());
						expect($(".pager").eq(1).html()).toEqual($(divHead + pager + divTail).html());
					});

					it("掲示板ページで最後のページの時、上も下も記事へのリンクが出来る", function(){
						//setUp
						var nowUrl = "http://dic.nicovideo.jp/b/a/bbs/1-";
						spyOn(urlAnalyzer, "getNowUrl").and.returnValue(nowUrl);
						sut = new c.ManagerToReadBbs(urls, urlAnalyzer);
						spyOn(sut, "readPreviousBbs");
						spyOn(sut, "readNextBbs");
						var divHead = '<div class="pager">'
						var navi1 = '<a href="/a/bbs" class="navi">-bbsの記事へ戻る-</a>';
						var pager = '<span class="current">1-</span>';
						var navi2 = "";
						var divTail = '</div>';
						$("#sandbox").append('<div id="bbs">' + divHead + navi1 + pager + navi2 + divTail + divHead + navi1 + pager + navi2 + divTail + '</div>');
						//exeicise
						sut.initPager();
						//verify
						expect($(".pager").eq(0).find("a").size()).toEqual(1);
						expect($(".pager").eq(0).find("a").eq(0).html()).toEqual("-bbsの記事へ戻る-");
						expect($(".pager").eq(1).find("a").size()).toEqual(1);
						expect($(".pager").eq(1).find("a").eq(0).html()).toEqual("-bbsの記事へ戻る-");
					});
				});

				describe("掲示板が0ページの時", function(){
					beforeEach(function(){
						urls = [];
					});

					it("記事ページでは何も変化しない", function(){
						//setUp
						var nowUrl = "http://dic.nicovideo.jp/a/bbs";
						spyOn(urlAnalyzer, "getNowUrl").and.returnValue(nowUrl);
						sut = new c.ManagerToReadBbs(urls, urlAnalyzer);
						//exercise
						sut.initPager();
						//verify
						expect($(".pager").size()).toEqual(0);
					});
				});
			});

			describe('addToOnePageがfalseのとき', function(){
				beforeEach(function(){
					GM_setValue('addToOnePage', false);
				});

				it('pagerは変更されない', function(){
					//setUp
					var nowUrl = "http://dic.nicovideo.jp/b/a/bbs/1-";
					spyOn(urlAnalyzer, "getNowUrl").and.returnValue(nowUrl);
					sut = new c.ManagerToReadBbs(urls, urlAnalyzer);
					spyOn(sut, "readPreviousBbs");
					spyOn(sut, "readNextBbs");
					var divHead = '<div class="pager">'
					var navi1 = '<a href="/a/bbs" class="navi">-bbsの記事へ戻る-</a>';
					var pager = '<span class="current">1-</span><a href="/b/a/bbs/31-">31-</a><a href="/b/a/bbs/61-">61-</a>';
					var navi2 = '<a href="/b/a/bbs/31-" class="navi">次へ &#187;</a>';
					var divTail = '</div>';
					$("#sandbox").append('<div id="bbs">' + divHead + navi1 + pager + navi2 + divTail + divHead + navi1 + pager + navi2 + divTail + '</div>');
					//exeicise
					sut.initPager();
					//verify
					expect($('#bbs .pager:eq(0)').html()).toEqual(navi1 + pager + navi2.replace('&#187;', '»'));
					expect($('#bbs .pager:eq(1)').html()).toEqual(navi1 + pager + navi2.replace('&#187;', '»'));
				});
			});
		});

		describe("initSmallBbsのテスト", function(){
			beforeEach(function(){
				$("body").append("<div id='sandbox'></div>");
				$("#sandbox").append("<div id='bbs'><dl></dl></div>");
				$("#bbs dl").append(
					'<div class="pager"><a href="/a/bbs" class="navi">-bbsの記事へ戻る-</a><a href="/b/a/bbs/1-">1-</a></div>' +
					'<dt class="reshead"><a name="31" class="resnumhead"></a>31 ： <span class="name">ななしのよっしん</span> ：2009/01/11(日) 23:44:16 ID: b6fD7NC5x/</dt>' + 
					'<dd class="resbody"><a href="/b/a/bbs/31-#31" rel="nofollow" target="_blank" class="dic">&gt;&gt;31</a></dd>' + 
					'<dt class="reshead"><a name="32" class="resnumhead"></a>32 ： <span class="name">NGネーム</span> ：2009/01/11(日) 23:44:16 ID: b6fD7NC5x/</dt>' +
					'<dd class="resbody">NGネーム</dd>');
				$("#sandbox").prepend("<div id='topline' style='height: 36px; position: fixed;><ul id='topbarRightMenu' class='popupRightMenu'>" + 
					"<li id='topbarLogoutMenu' style='display:none;''><a href='/p/logout'>ログアウト</a></li></ul></div>");
				urls[0] = basicUrl + "1-";
				var nowUrl = "http://dic.nicovideo.jp/a/bbs";
				spyOn(urlAnalyzer, "getNowUrl").and.returnValue(nowUrl);
				sut = new c.ManagerToReadBbs(urls, urlAnalyzer);
				GM_setValue("addToOnePage", true);
				GM_setValue("tooltipOnDicPage", true);
				GM_setValue("showIDTooltip", true);
				GM_setValue("showResAnchorTooltip", true);
				GM_setValue("useNG", true);
				GM_setValue("ngname", "NGネーム");
			});

			afterEach(function(){
				$("#sandbox").remove();
			})

			it("IDの色分けやツールチップ、コンテクストメニューやメニュー等が全て用意される", function(){
				//setUp
				GM_setValue("classificationID", true);
				//exercise
				sut.initSmallBbs();
				//verify
				expect($(".navi").size()).toEqual(0);
				var res = $("#bbs dl dt").eq(0);
				expect(res.html()).toMatch(/\[1\/2\]/);
		  		expect(res.find("div").hasClass("IDMulti")).toEqual(true);
		  		res.find(".IDMulti").trigger("mouseenter");
		  		expect(res.find("div[class^='ID'] > div .reshead").size()).toEqual(2);
		  		res.find(".IDMulti").trigger("mouseleave");
		  		expect(res.find("div[class^='ID'] > div").size()).toEqual(0);
		  		expect($("#bbs dl dd").eq(0).find("a.dic").attr("target")).toBeUndefined();
		  		$("#bbs dl dd").eq(0).find("a.dic").trigger("mouseenter");
		  		expect($("#bbs dl dd").eq(0).find("span.numTooltip > div .reshead").size()).toEqual(1);
		  		$("#bbs dl dd").eq(0).find("a.dic").trigger("mouseleave");
		  		expect(res.hasClass("deleted")).toEqual(false);
		  		expect($("#bbs dl dt").eq(1).hasClass("deleted")).toEqual(true);
		  		expect(res.find("#contextMenu").size()).toEqual(0);
		  		res.find(".IDMulti").trigger("click");
		  		expect(res.find("#contextMenu").size()).toEqual(1);
		  		res.find(".IDMulti #contextMenu #ngidMenu").trigger("click");
		  		expect($("#bbs dl .deleted").size()).toEqual(2);
		  		expect($("#bbs").css("display")).not.toEqual("none");
		  		$("#ngLi").trigger("click");
		  		expect($("#bbs").css("display")).toEqual("none");
		  		$("#useNGCheckbox").attr("checked", false);
		  		$("#decideNG").trigger("click");
		  		expect($("#bbs dl .deleted").size()).toEqual(0);
		  		$("#bbsLi").trigger("click");
		  		expect($("#bbs").css("display")).not.toEqual("none");
			});
		});


		describe("readPreviousBbsのテスト", function(){
			var htmlDl;
			beforeEach(function(){
				urls[0] = basicUrl + "1-";
				urls[1] = basicUrl + "31-";
				urls[2] = basicUrl + "61-";
				var htmlHead = "<div id='bbs'>" +
					'<div class="pager"><a href="/a/bbs" class="navi">-bbsの記事へ戻る-</a><a href="/b/a/bbs/1-">1-</a></div>' +
					"<dl id='bbsmain'>";
				htmlDl = "<dt>a</dt>";
				var htmlTail = "</dl>" +
					'<div class="pager"><a href="/a/bbs" class="navi">-bbsの記事へ戻る-</a><a href="/b/a/bbs/1-">1-</a></div>' +
					"</div>";
				var html = htmlHead + htmlDl + htmlTail;
				$("#sandbox").append(html);
				spyOn($, "get").and.callFake(function(url, callback){
					callback(html);
				});
				GM_setValue("addToOnePage", true);
			});

			afterEach(function(){
				$("#sandbox").remove();
			})

			it("前にページ2つ以上有るとき、前のページのdlを引数にprependBbsを呼び出す。このときnowloadingが表示され、前へボタンは表示されたままで、startIndexが1減り、ロックがかかる", function(){
				//setUp
				spyOn(urlAnalyzer, "getNowUrl").and.returnValue(basicUrl + "61-");
				sut = new c.ManagerToReadBbs(urls, urlAnalyzer);
				spyOn(sut, "prependBbs");
				spyOn(urlAnalyzer, "inArticlePage").and.returnValue(false);
				sut.initPager();
				//exercise
				sut.readPreviousBbs();
				//verify
				expect(sut.prependBbs.calls.argsFor(0)[0].html()).toEqual(htmlDl);
				expect(sut.isNowLoading).toEqual(true);
				expect(sut.startIndex).toEqual(1);
				expect($("#loadPreviousPageLinks").size()).toEqual(1);
				expect($("#loading").html()).toEqual("now loading...");
			});

			it("前にページが1つのとき、前へボタンは消える", function(){
				//setUp
				spyOn(urlAnalyzer, "getNowUrl").and.returnValue(basicUrl + "31-");
				sut = new c.ManagerToReadBbs(urls, urlAnalyzer);
				spyOn(sut, "prependBbs");
				spyOn(urlAnalyzer, "inArticlePage").and.returnValue(false);
				sut.initPager();
				//exercise
				sut.readPreviousBbs();
				//verify
				expect(sut.prependBbs.calls.argsFor(0)[0].html()).toEqual(htmlDl);
				expect(sut.isNowLoading).toEqual(true);
				expect(sut.startIndex).toEqual(0);
				expect($("#loadPreviousPageLinks").size()).toEqual(0);
				expect($("#loading").html()).toEqual("now loading...");
			});

			it("前にページが無いとき、何も起こらない", function(){
				//setUp
				spyOn(urlAnalyzer, "getNowUrl").and.returnValue(basicUrl + "1-");
				sut = new c.ManagerToReadBbs(urls, urlAnalyzer);
				spyOn(sut, "prependBbs");
				spyOn(urlAnalyzer, "inArticlePage").and.returnValue(false);
				sut.initPager();
				//exercise
				sut.readPreviousBbs();
				//verify
				expect(sut.prependBbs).not.toHaveBeenCalledWith();
				expect(sut.isNowLoading).toEqual(false);
				expect(sut.startIndex).toEqual(0);
				expect($("#loading").size()).toEqual(0);
			});

			it("isNowLoadingがtrueのとき、何も起こらない", function(){
				//setUp
				spyOn(urlAnalyzer, "getNowUrl").and.returnValue(basicUrl + "61-");
				sut = new c.ManagerToReadBbs(urls, urlAnalyzer);
				spyOn(sut, "prependBbs");
				spyOn(urlAnalyzer, "inArticlePage").and.returnValue(false);
				sut.initPager();
				sut.isNowLoading = true;
				//exercise
				sut.readPreviousBbs();
				//verify
				expect(sut.prependBbs).not.toHaveBeenCalledWith();
				expect(sut.isNowLoading).toEqual(true);
				expect(sut.startIndex).toEqual(2);
				expect($("#loading").size()).toEqual(0);
			});
		});

		describe("prependBbsのテスト", function(){
			var appendDl;
			var sut;
			beforeEach(function(){
				GM_setValue("useNG", true);
				GM_setValue("showIDTooltip", true);
				GM_setValue("showResAnchorTooltip", true);
				GM_setValue("classificationID", true);
				GM_setValue("tooltipOnDicPage", true);
				GM_setValue("ngid", "b6fD7NC5x/");
				$("#sandbox").append("<div id='bbs'><dl>" +
					'<dt class="reshead"><a name="33" class="resnumhead"></a>33 ： <span class="name">NGネーム</span> ：2009/01/11(日) 23:44:16 ID: b6fD7NC5x/</dt>' +
					'<dd class="resbody"><a href="/b/a/bbs/31-#33" rel="nofollow" target="_blank" class="dic">&gt;&gt;33</a></dd>' +
					'<dt class="reshead"><a name="34" class="resnumhead"></a>34 ： <span class="name">再帰</span> ：2009/01/11(日) 23:44:16 ID: b6fD7NC5xa</dt>' +
					'<dd class="resbody"><a href="/b/a/bbs/31-#34" rel="nofollow" target="_blank" class="dic">&gt;&gt;34</a></dd>' +
					"</dl></div>");
				appendDl = $("<dl>" +
					'<dt class="reshead"><a name="31" class="resnumhead"></a>31 ： <span class="name">ななしのよっしん</span> ：2009/01/11(日) 23:44:16 ID: b6fD7NC5x/</dt>' +
					'<dd class="resbody">a</dd>' +
					'<dt class="reshead"><a name="32" class="resnumhead"></a>32 ： <span class="name">ななしのよっしん</span> ：2009/01/11(日) 23:44:16 ID: b6fD7NC5ng</dt>' +
					'<dd class="resbody"><a href="/b/a/bbs/31-#34" rel="nofollow" target="_blank" class="dic">&gt;&gt;34</a></dd>' +
					"</dl>");
				urls[0] = basicUrl + "1-";
				urls[1] = basicUrl + "31-";
				urls[2] = basicUrl + "61-";
				$("#sandbox dl").prepend("<p id='loading'>now loading...</p>");
				spyOn(urlAnalyzer, "getNowUrl").and.returnValue(basicUrl + "61-");
				spyOn(urlAnalyzer, "inArticlePage").and.returnValue(false);
				sut = new c.ManagerToReadBbs(urls, urlAnalyzer);
				sut.isNowLoading = true;
				sut.startIndex = 1;
				sut.initSmallBbs();
			});

			it("prependBbsで、パラメータの中身が#bbs dlの前に追加される", function(){
				//exercise
				sut.prependBbs(appendDl);
				//verify
				expect($("#bbs dl dt").size()).toEqual(4);
				var res = $("#bbs dl dt").eq(0);
				expect(res.html()).toMatch(/\[1\/2\]/);
				expect(res.hasClass("deleted")).toEqual(true);
				expect($("#loading").size()).toEqual(0);
				expect(sut.isNowLoading).toEqual(false);
				var res2 = $("#bbs dl dt").eq(1);
				expect($("#bbs dl dd").eq(1).find("a.dic").attr("target")).toBeUndefined();
				expect($("#bbs dl dd").eq(1).find("a.dic").attr("href")).toEqual("/b/a/bbs/61-#34");
				expect(res2.hasClass("deleted")).toEqual(false);
				expect(res2.find("#contextMenu").size()).toEqual(0);
				res2.find(".ID").trigger("click");
				expect(res2.find("#contextMenu").size()).toEqual(1);
				res2.find("#contextMenu #ngidMenu").trigger("click");
				expect(res2.hasClass("deleted")).toEqual(true);
				var res4 = $("#bbs dl dd").eq(3);
				res4.find("a.dic").trigger("mouseenter");
				expect(res4.find("span.numTooltip > div .reshead").size()).toEqual(1);
				res4.find("a.dic").trigger("mouseleave");
			});
		});

		describe("readNextBbsのテスト", function(){
			var htmlDl;
			beforeEach(function(){
				urls[0] = basicUrl + "1-";
				urls[1] = basicUrl + "31-";
				urls[2] = basicUrl + "61-";
				var htmlHead = "<div id='bbs'>" +
					'<div class="pager"><a href="/a/bbs" class="navi">-bbsの記事へ戻る-</a><a href="/b/a/bbs/1-">1-</a></div>' +
					"<dl id='bbsmain'>";
				htmlDl = "<dt>a</dt>";
				var htmlTail = "</dl>" +
					'<div class="pager"><a href="/a/bbs" class="navi">-bbsの記事へ戻る-</a><a href="/b/a/bbs/1-">1-</a></div>' +
					"</div>";
				var html = htmlHead + htmlDl + htmlTail;
				$("#sandbox").append(html);
				spyOn($, "get").and.callFake(function(url, callback){
					callback(html);
				});
				GM_setValue("addToOnePage", true);
			});

			afterEach(function(){
				$("#sandbox").remove();
			})

			it("次にページ2つ以上有るとき、前のページのdlを引数にappendBbsを呼び出す。このときnowloadingが表示され、前へボタンは表示されたままで、startIndexが1減り、ロックがかかる", function(){
				//setUp
				spyOn(urlAnalyzer, "getNowUrl").and.returnValue(basicUrl + "1-");
				sut = new c.ManagerToReadBbs(urls, urlAnalyzer);
				spyOn(sut, "appendBbs");
				spyOn(urlAnalyzer, "inArticlePage").and.returnValue(false);
				sut.initPager();
				//exercise
				sut.readNextBbs();
				//verify
				expect(sut.appendBbs.calls.argsFor(0)[0].html()).toEqual(htmlDl);
				expect(sut.isNowLoading).toEqual(true);
				expect(sut.endIndex).toEqual(1);
				expect($("#loadNextPageLinks").size()).toEqual(1);
				expect($("#loading").html()).toEqual("now loading...");
			});

			it("次にページが1つのとき、前へボタンは消える", function(){
				//setUp
				spyOn(urlAnalyzer, "getNowUrl").and.returnValue(basicUrl + "31-");
				sut = new c.ManagerToReadBbs(urls, urlAnalyzer);
				spyOn(sut, "appendBbs");
				spyOn(urlAnalyzer, "inArticlePage").and.returnValue(false);
				sut.initPager();
				//exercise
				sut.readNextBbs();
				//verify
				expect(sut.appendBbs.calls.argsFor(0)[0].html()).toEqual(htmlDl);
				expect(sut.isNowLoading).toEqual(true);
				expect(sut.endIndex).toEqual(2);
				expect($("#loadNextPageLinks").size()).toEqual(0);
				expect($("#loading").html()).toEqual("now loading...");
			});

			it("次にページが無いとき、何も起こらない", function(){
				//setUp
				spyOn(urlAnalyzer, "getNowUrl").and.returnValue(basicUrl + "61-");
				sut = new c.ManagerToReadBbs(urls, urlAnalyzer);
				spyOn(sut, "appendBbs");
				spyOn(urlAnalyzer, "inArticlePage").and.returnValue(false);
				sut.initPager();
				//exercise
				sut.readNextBbs();
				//verify
				expect(sut.appendBbs).not.toHaveBeenCalledWith();
				expect(sut.isNowLoading).toEqual(false);
				expect(sut.endIndex).toEqual(2);
				expect($("#loading").size()).toEqual(0);
			});

			it("isNowLoadingがtrueのとき、何も起こらない", function(){
				//setUp
				spyOn(urlAnalyzer, "getNowUrl").and.returnValue(basicUrl + "1-");
				sut = new c.ManagerToReadBbs(urls, urlAnalyzer);
				spyOn(sut, "appendBbs");
				spyOn(urlAnalyzer, "inArticlePage").and.returnValue(false);
				sut.initPager();
				sut.isNowLoading = true;
				//exercise
				sut.readNextBbs();
				//verify
				expect(sut.appendBbs).not.toHaveBeenCalledWith();
				expect(sut.isNowLoading).toEqual(true);
				expect(sut.endIndex).toEqual(0);
				expect($("#loading").size()).toEqual(0);
			});
		});

		describe("appendBbsのテスト", function(){
			var appendDl;
			var sut;
			beforeEach(function(){
				GM_setValue("useNG", true);
				GM_setValue("showIDTooltip", true);
				GM_setValue("classificationID", true);
				GM_setValue("tooltipOnDicPage", true);
				GM_setValue("ngid", "b6fD7NC5x/");
				$("#sandbox").append("<div id='bbs'><dl>" +
					'<dt class="reshead"><a name="31" class="resnumhead"></a>31 ： <span class="name">NGネーム</span> ：2009/01/11(日) 23:44:16 ID: b6fD7NC5x/</dt>' +
					'<dd class="resbody">NGネーム</dd>' +
					"</dl></div>");
				appendDl = $("<dl>" +
					'<dt class="reshead"><a name="32" class="resnumhead"></a>32 ： <span class="name">ななしのよっしん</span> ：2009/01/11(日) 23:44:16 ID: b6fD7NC5x/</dt>' +
					'<dd class="resbody">NGID</dd>' +
					'<dt class="reshead"><a name="33" class="resnumhead"></a>33 ： <span class="name">ななしのよっしん</span> ：2009/01/11(日) 23:44:16 ID: b6fD7NC5ng</dt>' +
					'<dd class="resbody"><a href="/b/a/bbs/31-#32" rel="nofollow" target="_blank" class="dic">&gt;&gt;32</a></dd>' +
					"</dl>");
				urls[0] = basicUrl + "1-";
				urls[1] = basicUrl + "31-";
				urls[2] = basicUrl + "61-";
				$("#sandbox dl").prepend("<p id='loading'>now loading...</p>");
				spyOn(urlAnalyzer, "getNowUrl").and.returnValue(basicUrl + "1-");
				spyOn(urlAnalyzer, "inArticlePage").and.returnValue(false);
				sut = new c.ManagerToReadBbs(urls, urlAnalyzer);
				sut.isNowLoading = true;
				sut.endIndex = 1;
				sut.initSmallBbs();
			});

			it("appendBbsで、パラメータの中身が#bbs dlの前に追加される", function(){
				//exercise
				sut.appendBbs(appendDl);
				//verify
				expect($("#bbs dl dt").size()).toEqual(3);
				var res = $("#bbs dl dt").eq(1);
				expect(res.html()).toMatch(/\[2\/2\]/);
				expect(res.hasClass("deleted")).toEqual(true);
				expect($("#loading").size()).toEqual(0);
				expect(sut.isNowLoading).toEqual(false);
				var res2 = $("#bbs dl dt").eq(2);
				expect($("#bbs dl dd").eq(2).find("a.dic").attr("target")).toBeUndefined();
				expect($("#bbs dl dd").eq(2).find("a.dic").attr("href")).toEqual("/b/a/bbs/1-#32");
				expect(res2.hasClass("deleted")).toEqual(false);
				expect(res2.find("#contextMenu").size()).toEqual(0);
				res2.find(".ID").trigger("click");
				expect(res2.find("#contextMenu").size()).toEqual(1);
				res2.find("#contextMenu #ngidMenu").trigger("click");
				expect(res2.hasClass("deleted")).toEqual(true);
			});
		});

		describe("scrollLoaderのテスト", function(){
			var sut;
			beforeEach(function(){
				urls[0] = basicUrl + "1-";
				urls[1] = basicUrl + "31-";
				urls[2] = basicUrl + "61-";
				$("#sandbox").append("<div style='height: 1000px;'></div>");
				$("#sandbox").append("<div id='bbs'><dl id='bbsmain'><dt>a</dt></dl></div>");
				sut = new c.ManagerToReadBbs(urls);
				spyOn(sut, "readNextBbs");
				jasmine.clock().install();
			});

			afterEach(function(){
				jasmine.clock().uninstall();
				$(window).unbind("scroll");
				$(window).scrollTop(0);
			});

			it("掲示板が表示されていて、autoLoadフラグが立っている時、スクロールによって掲示板の下が表示されるならreadNextBbsが1回呼び出される", function(){
				//setUp
				$("#sandbox").prepend('<li>NicoDicBBSViewer</li><li id="bbsLi" class="selected">' +
					'<a href="#">掲示板を表示する</a></li><li id="ngLi"><a href="#">設定画面を表示する</a></li>');
				GM_setValue("autoLoad", true);
				//exercise
				sut.scrollLoader();
				//verify
				expect(sut.reserved).toEqual(false);
				$(window).scrollTop(1000);
				$(window).trigger("scroll");
				$(window).trigger("scroll");
				expect(sut.reserved).toEqual(true);
				jasmine.clock().tick(999);
				expect(sut.readNextBbs).not.toHaveBeenCalled();
				jasmine.clock().tick(1);
				expect(sut.reserved).toEqual(false);
				expect(sut.readNextBbs.calls.count()).toEqual(1)
			});

			it("掲示板が表示されていて、autoLoadフラグが立っている時でも、スクロールによって掲示板の下が表示されないならreadNextBbsが呼び出されない", function(){
				//setUp
				$("#sandbox").prepend('<li>NicoDicBBSViewer</li><li id="bbsLi" class="selected">' +
					'<a href="#">掲示板を表示する</a></li><li id="ngLi"><a href="#">設定画面を表示する</a></li>');
				GM_setValue("autoLoad", true);
				//exercise
				sut.scrollLoader();
				//verify
				$(window).trigger("scroll");
				expect(sut.reserved).toEqual(false);
				jasmine.clock().tick(1000);
				expect(sut.reserved).toEqual(false);
				expect(sut.readNextBbs).not.toHaveBeenCalled();
			});

			it("設定画面が表示されているなら、スクロールしてもreadNextBbsが呼び出されない", function(){
				//setUp
				$("#sandbox").prepend('<li>NicoDicBBSViewer</li><li id="bbsLi">' +
					'<a href="#">掲示板を表示する</a></li><li id="ngLi" class="selected"><a href="#">設定画面を表示する</a></li>');
				GM_setValue("autoLoad", true);
				//exercise
				sut.scrollLoader();
				//verify
				$(window).scrollTop(1000);
				$(window).trigger("scroll");
				expect(sut.reserved).toEqual(false);
				jasmine.clock().tick(1000);
				expect(sut.reserved).toEqual(false);
				expect(sut.readNextBbs).not.toHaveBeenCalled();
			});

			it("autoLoadが立っていないなら、スクロールしてもreadNextBbsが呼び出されない", function(){
				//setUp
				$("#sandbox").prepend('<li>NicoDicBBSViewer</li><li id="bbsLi" class="selected">' +
					'<a href="#">掲示板を表示する</a></li><li id="ngLi"><a href="#">設定画面を表示する</a></li>');
				//exercise
				sut.scrollLoader();
				//verify
				$(window).scrollTop(1000);
				$(window).trigger("scroll");
				expect(sut.reserved).toEqual(false);
				jasmine.clock().tick(1000);
				expect(sut.reserved).toEqual(false);
				expect(sut.readNextBbs).not.toHaveBeenCalled();
			});
		});
	});

	describe("MemuOperatorのテスト", function(){
		var reshead;
		var resbody;
		var res;
		var list;
		var sut;
		var ngOperator;
		beforeEach(function(){
			reshead = [];
			resbody = [];
			res = [];
			reshead[0] = '<dt class="reshead"><a name="31" class="resnumhead"></a>31 ： <span class="name">ななしのよっしん</span> ：2009/01/11(日) 23:44:16 ID: b6fD7NC5ng</dt>';
			resbody[0] = '<dd class="resbody">NGID</dd>';
			reshead[1] = '<dt class="reshead"><a name="32" class="resnumhead"></a>32 ： <span class="name">NGネーム</span> ：2009/01/11(日) 23:44:16 ID: b6fD7NC5x/</dt>';
			resbody[1] = '<dd class="resbody">NGネーム</dd>';
			reshead[2] = '<dt class="reshead"><a name="33" class="resnumhead"></a>33 ： <span class="name">ななしのよっしん</span> ：2009/01/11(日) 23:44:16 ID: b6fD7NC5x/</dt>';
			resbody[2] = '<dd class="resbody">NGワード</dd>';
			reshead[3] = '<dt class="reshead"><a name="34" class="resnumhead"></a>34 ： <span class="name">31</span> ：2009/01/11(日) 23:44:16 ID: b6fD7NC5x/</dt>';
			resbody[3] = '<dd class="resbody">NGレス</dd>';
			var html = constructDl(reshead, resbody);
			list = new c.ResCollection();
			list.createResList($(html));
			list.createResListById();
			for(var i = 0; i < list.resList.length; i++){
				list.resList[i].backupRes();
				res[i] = list.resList[i];
			}
			ngOperator = new c.NgOperator();
			sut = new c.MenuOperator(list, ngOperator);
			$("body").append("<div id='sandbox'></div>");
			$("#sandbox").append("<div id='bbs'><dl></dl></div><ul id='contextMenu'></ul>");
			for(var i = 0; i < res.length; i++){
				res[i].makeIDDiv(list.resListById);
				$("#bbs dl").append(res[i].reshead);
				$("#bbs dl").append(res[i].resbody);
			};
			list.setContextMenu();
			$("#contextMenu").append('<li id="ngidMenu">NGIDに追加</li><li id="ngnameMenu">NGNameに追加</li><li id="ngresMenu">このレスを削除</li>');
			$("head").append("<style id='nicoDicBBSViewerCSS'></style>");
		});

		afterEach(function(){
			$("#sandbox").remove();
			$("#nicoDicBBSViewerCSS").remove();
		})

		describe("bindContextMenuのテスト", function(){
			beforeEach(function(){
				GM_setValue("useNG", true);
				$("#sandbox").append("<div id='ng'></div>");
				$("#ng").append("<textarea id='ngidTextarea'></textarea><textarea id='ngnameTextarea'></textarea>" + 
				"<textarea id='ngresTextarea'></textarea><textarea id='ngresTextarea'></textarea>");
			});

			it("NGIDが空の時、右クリックからNGIDを登録して、また適応することができる", function(){
				//exercise
				sut.bindContextMenu();
				res[0].reshead.find(".ID").trigger("click");
				res[0].reshead.find("#contextMenu #ngidMenu").trigger("click");
				//verify
				expect(res[0].reshead.find("#contextMenu").size()).toEqual(0);
				expect(res[0].reshead.hasClass("deleted")).toEqual(true);
				expect(GM_getValue("ngid")).toEqual("b6fD7NC5ng");
				expect($("#ngidTextarea").val()).toEqual("b6fD7NC5ng");
			});

			it("NGIDが空でないの時、右クリックからNGIDを登録して、また適応することができる", function(){
				//setUp
				GM_setValue("ngid", "dummyid");
				//exercise
				sut.bindContextMenu();
				res[0].reshead.find(".ID").trigger("click");
				res[0].reshead.find("#contextMenu #ngidMenu").trigger("click");
				//verify
				expect(res[0].reshead.find("#contextMenu").size()).toEqual(0);
				expect(res[0].reshead.hasClass("deleted")).toEqual(true);
				expect(GM_getValue("ngid")).toEqual("dummyid\nb6fD7NC5ng");
				expect($("#ngidTextarea").val()).toEqual("dummyid\nb6fD7NC5ng");
			});

			it("NGIDが登録済みのとき、何もしない", function(){
				//setUp
				GM_setValue("ngid", "b6fD7NC5ng");
				ngOperator.initNg();
				ngOperator.applyNg(list.resList);
				spyOn(ngOperator, "applyNg").and.callThrough();
				//exercise
				sut.bindContextMenu();
				res[0].reshead.find(".ID").trigger("click");
				res[0].reshead.find("#contextMenu #ngidMenu").trigger("click");
				//verify
				expect(ngOperator.applyNg).not.toHaveBeenCalled();
			});

			it("NGNameが空の時、右クリックからNGNameを登録して、また適応することができる", function(){
				//exercise
				sut.bindContextMenu();
				res[1].reshead.find(".ID").trigger("click");
				res[1].reshead.find("#contextMenu #ngnameMenu").trigger("click");
				//verify
				expect(res[1].reshead.find("#contextMenu").size()).toEqual(0);
				expect(res[1].reshead.hasClass("deleted")).toEqual(true);
				expect(GM_getValue("ngname")).toEqual("NGネーム");
				expect($("#ngnameTextarea").val()).toEqual("NGネーム");
			});

			it("NGNameが空でないの時、右クリックからNGNameを登録して、また適応することができる", function(){
				//setUp
				GM_setValue("ngname", "dummyname");
				//exercise
				sut.bindContextMenu();
				res[1].reshead.find(".ID").trigger("click");
				res[1].reshead.find("#contextMenu #ngnameMenu").trigger("click");
				//verify
				expect(res[1].reshead.find("#contextMenu").size()).toEqual(0);
				expect(res[1].reshead.hasClass("deleted")).toEqual(true);
				expect(GM_getValue("ngname")).toEqual("dummyname\nNGネーム");
				expect($("#ngnameTextarea").val()).toEqual("dummyname\nNGネーム");
			});

			it("NGNameが登録済みのとき、何もしない", function(){
				//setUp
				GM_setValue("ngname", "NGネーム");
				ngOperator.initNg();
				ngOperator.applyNg(list.resList);
				spyOn(ngOperator, "applyNg").and.callThrough();
				//exercise
				sut.bindContextMenu();
				res[1].reshead.find(".ID").trigger("click");
				res[1].reshead.find("#contextMenu #ngnameMenu").trigger("click");
				//verify
				expect(ngOperator.applyNg).not.toHaveBeenCalled();
			});

			it("NGResが空の時、右クリックからNGResを登録して、また適応することができる", function(){
				//exercise
				sut.bindContextMenu();
				spyOn(sut.urlAnalyzer, "getNowUrl").and.returnValue("http://dic.nicovideo.jp/b/a/bbs/1-");
				spyOn(ngOperator.urlAnalyzer, "getNowUrl").and.returnValue("http://dic.nicovideo.jp/b/a/bbs/1-");
				res[3].reshead.find(".ID").trigger("click");
				res[3].reshead.find("#contextMenu #ngresMenu").trigger("click");
				//verify
				expect(res[3].reshead.find("#contextMenu").size()).toEqual(0);
				expect(res[3].reshead.hasClass("deleted")).toEqual(true);
				expect(GM_getValue("ngres")).toEqual("bbs:34");
				expect($("#ngresTextarea").val()).toEqual("bbs:34");
			});
		});

		describe("insertConfigHtmlのテスト", function(){
			beforeEach(function(){
				$("#sandbox").prepend('<ul id="topbarRightMenu" class="popupRightMenu"><li id="topbarLogoutMenu" style="display:none;">' +
					'<a href="/p/logout">ログアウト</a></li></ul>');

			});

			var setFlag = function(ids){
				for(var i = 0; i < ids.length; i++){
					GM_setValue(ids[i], true);
				}
			};

			it("掲示板と設定画面の切り替えがツールバーの特定のところに追加される", function(){
				//exercise
				sut.insertConfigHtml();
				//verify
				expect($("#topbarLogoutMenu+li").html()).toEqual("NicoDicBBSViewer");
				expect($("#topbarLogoutMenu+li+#bbsLi").hasClass("selected")).toEqual(true);
				expect($("#topbarLogoutMenu+li+#bbsLi a").html()).toEqual("掲示板を表示する");
				expect($("#topbarLogoutMenu+li+#bbsLi+#ngLi").hasClass("selected")).toEqual(false);
				expect($("#topbarLogoutMenu+li+#bbsLi+#ngLi a").html()).toEqual("設定画面を表示する")
			});

			it("NGが設定されていないときNGの設定画面が追加される", function(){
				//exercise
				sut.insertConfigHtml();
				//verify
				expect($("#bbs~#ng").size()).toEqual(1);
				expect($("#bbs~#ng div").filter(function(){return $(this).css("float") === "left"}).size()).toEqual(4);
				expect($("#bbs~#ng div p").size()).toEqual(4);
				expect($("#bbs~#ng div textarea").size()).toEqual(4);
				$("#bbs~#ng div textarea").each(function(){expect($(this).val()).toEqual("")});
			});

			it("NGが設定されていないときNGの設定画面が追加される", function(){
				//setUp
				var nglist = ["ngid", "ngname", "ngword", "ngres"];
				for(var i = 0; i < nglist.length; i++){
					GM_setValue(nglist[i], nglist[i]);
				}
				//exercise
				sut.insertConfigHtml();
				//verify
				expect($("#bbs~#ng").size()).toEqual(1);
				expect($("#bbs~#ng div").filter(function(){return $(this).css("float") === "left"}).size()).toEqual(4);
				expect($("#bbs~#ng div p").size()).toEqual(4);
				expect($("#bbs~#ng div textarea").size()).toEqual(4);
				var i = 0;
				$("#bbs~#ng div textarea").each(function(){expect($(this).val()).toEqual(nglist[i]); i++;});
			});

			it("設定が全てundefinedあるいはfalseのとき、設定のチェックボックスが追加されて、全てにチェックがついていない", function(){
				//exercise
				sut.insertConfigHtml();
				//verify
				expect($("#ng form > ul > li").size()).toEqual(6);
				expect($("#ng form > ul > li > ul").eq(0).find("input:checkbox").size()).toEqual(2);
				expect($("#ng form > ul > li > ul").eq(1).find("input:checkbox").size()).toEqual(4);
				expect($("#ng form > ul > li > ul").eq(2).find("input:checkbox").size()).toEqual(2);
				expect($("#ng form input:checkbox").size()).toEqual(11);
				expect($("#ng form input:checkbox:not(:checked)").size()).toEqual(11);
			});

			it("設定が全てtrueのとき、設定のチェックボックスが追加されて、全てにチェックがついている", function(){
				//exercise
				setFlag(["autoLoad", "useNG", "seethroughNG", "tooltipOnDicPage", "showIDTooltip", "showResAnchorTooltip", "showResNumberTooltip",
					"showResHandleTooltip",	"classificationID", "classificationResNumber", "addToOnePage"]);
				//exercise
				sut.insertConfigHtml();
				//verify
				expect($("#ng form > ul > li").size()).toEqual(6);
				expect($("#ng form > ul > li > ul").eq(0).find("input:checkbox").size()).toEqual(2);
				expect($("#ng form > ul > li > ul").eq(1).find("input:checkbox").size()).toEqual(4);
				expect($("#ng form > ul > li > ul").eq(2).find("input:checkbox").size()).toEqual(2);
				expect($("#ng form input:checkbox").size()).toEqual(11);
				expect($("#ng form input:checkbox:checked").size()).toEqual(11);
			});

			it("設定画面にボタンが追加される", function(){
				//exercise
				sut.insertConfigHtml();
				//verify
				expect($("#ng button").size()).toEqual(3);
				expect($("#ng button").eq(0).attr("id")).toEqual("decideNG");
				expect($("#ng button").eq(1).attr("id")).toEqual("cancelNG");
				expect($("#ng button").eq(2).attr("id")).toEqual("backToBbsButton");
			});

			it("コンテクストメニューのhtmlが追加される", function(){
				//setUp
				$("#contextMenu").remove();
				//exercise
				sut.insertConfigHtml();
				//verify
				expect($("#contextMenu li").size()).toEqual(3);
				expect($("#contextMenu li").eq(0).attr("id")).toEqual("ngidMenu");
				expect($("#contextMenu li").eq(1).attr("id")).toEqual("ngnameMenu");
				expect($("#contextMenu li").eq(2).attr("id")).toEqual("ngresMenu");
			});
		});

		describe("bindMenuのテスト", function(){
			describe("画面の設定のテスト", function(){
				beforeEach(function(){
					$("#sandbox").prepend("<div id='topline' style='height: 36px; position: fixed;><ul id='topbarRightMenu' class='popupRightMenu'>" + 
						"<li id='topbarLogoutMenu' style='display:none;''><a href='/p/logout'>ログアウト</a></li></ul></div>");
					$("#bbs").before("<div style='height:500px;'></div>");
					sut.insertConfigHtml();
				});

				it("ngLiをクリックすることで設定画面になり、メニューもngLiが選択されている状態になり、高さは設定画面が見える位置にある", function(){
					//exercise
					sut.bindMenu();
					$("#ngLi").trigger("click");
					//verify
					expect($("#bbs").css("display")).toEqual("none");
					expect($("#ng").css("display")).toEqual("block");
					expect($("#bbsLi").hasClass("selected")).toEqual(false);
					expect($("#ngLi").hasClass("selected")).toEqual(true);
					expect($("html").scrollTop()).toBeCloseTo($("#ng").offset().top - $("#topline").height(), -3);
				});

				it("スクロールをしてからngLiをクリックして、再度スクロールしてbbsLiをクリックすると、掲示板画面になり、メニューもbbsLiが選択されている状態になり、高さは前のスクロール位置になる", function(){
					//setUp
					sut.bindMenu();
					$("html").scrollTop(100);
					$("#ngLi").trigger("click");
					$("html").scrollTop(200);
					//exercise
					$("#bbsLi").trigger("click");
					//verify
					expect($("#ng").css("display")).toEqual("none");
					expect($("#bbs").css("display")).toEqual("block");
					expect($("#ngLi").hasClass("selected")).toEqual(false);
					expect($("#bbsLi").hasClass("selected")).toEqual(true);
					expect($("html").scrollTop()).toBeCloseTo(100, -1);
				});

				it("スクロールをしてからngLiをクリックして、再度スクロールしてbackToBbsButtonをクリックすると、掲示板画面になり、メニューもbbsLiが選択されている状態になり、高さは前のスクロール位置になる", function(){
					//setUp
					sut.bindMenu();
					$("html").scrollTop(100);
					$("#ngLi").trigger("click");
					$("html").scrollTop(200);
					//exercise
					$("#backToBbsButton").trigger("click");
					//verify
					expect($("#ng").css("display")).toEqual("none");
					expect($("#bbs").css("display")).toEqual("block");
					expect($("#ngLi").hasClass("selected")).toEqual(false);
					expect($("#bbsLi").hasClass("selected")).toEqual(true);
					expect($("html").scrollTop()).toBeCloseTo(100, -1);
				});
			});

			describe("設定に関するテスト", function(){

				var setFlag = function(ids){
					for(var i = 0; i < ids.length; i++){
						GM_setValue(ids[i], true);
					}
				};

				var changeCheckboxes = function(ids, checked){
					for(var i = 0; i < ids.length; i++){
						$("#" + ids[i] + "Checkbox").attr("checked", checked);
					}
				}

				var verifyGM = function(ids, bool){
					for(var i = 0; i < ids.length; i++){
						if(bool){
							expect(GM_getValue(ids[i])).toBeTruthy();
						}else{
							expect(GM_getValue(ids[i])).toBeFalsy();
						}
					}
				}
				/*["autoLoad", "useNG", "seethroughNG", "tooltipOnDicPage", "showIDTooltip", "showResAnchorTooltip", "showResNumberTooltip",
					"showResHandleTooltip",	"classificationID", "classificationResNumber"]*/
				beforeEach(function(){
					setFlag(["autoLoad", "useNG", "seethroughNG", "tooltipOnDicPage", "showIDTooltip"]);
					GM_setValue("ngid", "ngid");
					GM_setValue("ngname", "ngname");
					sut.insertConfigHtml();
					sut.bindMenu();
					changeCheckboxes(["autoLoad", "useNG", "seethroughNG"], false);
					changeCheckboxes(["showResAnchorTooltip", "showResNumberTooltip"], true);
					$("#ngidTextarea").val("ngid2");
					$("#ngnameTextarea").val("");
					$("#ngwordTextarea").val("ngword");
				});

				it("decideNGをクリックすることで、チェックボックスやテキストエリアがGMに反映され、またNGが反映される", function(){
					//setUp
					spyOn(sut.ngOperator, "initNg");
					spyOn(sut.ngOperator, "applyNg");
					//exercise
					$("#decideNG").trigger("click");
					//verify
					verifyGM(["tooltipOnDicPage", "showIDTooltip", "showResAnchorTooltip", "showResNumberTooltip"], true);
					verifyGM(["autoLoad", "useNG", "seethroughNG", "showResHandleTooltip",	"classificationID", "classificationResNumber"], false);
					expect(GM_getValue("ngid")).toEqual("ngid2");
					expect(GM_getValue("ngname")).toBeFalsy();
					expect(GM_getValue("ngword")).toEqual("ngword");
					expect(GM_getValue("ngres")).toBeFalsy();
					expect(sut.ngOperator.initNg).toHaveBeenCalled();
					expect(sut.ngOperator.applyNg).toHaveBeenCalledWith(list.resList);
				});

				it("cancelNGをクリックすることで、チェックボックkスやテキストエリアがGMの状態に戻る", function(){
					//exercise
					$("#cancelNG").trigger("click");
					//verify
					verifyGM(["autoLoad", "useNG", "seethroughNG", "tooltipOnDicPage", "showIDTooltip"], true);
					verifyGM(["showResAnchorTooltip", "showResNumberTooltip", "showResHandleTooltip", "classificationID", "classificationResNumber"], false);
					expect(GM_getValue("ngid")).toEqual("ngid");
					expect(GM_getValue("ngname")).toEqual("ngname");
					expect(GM_getValue("ngword")).toBeFalsy();
					expect(GM_getValue("ngres")).toBeFalsy();
				});
			});
		});
	});

	describe("mainのテスト", function(){
		var addHead;
		var htmlHead;
		var htmlTail;
		var barHtml;
		var basicUrl;
		var htmls;
		var urlAnalyzer;
		beforeEach(function(){
			addHead = '<link id="defCss" rel="stylesheet" type="text/css" href="/nd0.css?1404070300">';
			$("head").append(addHead);
			basicUrl = "http://dic.nicovideo.jp/b/a/hoge/";
			htmlHead = "<html><head></head><body>";
			htmlTail = "</body></html>";
			barHtml = '<div id="topline"><ul id="topbarRightMenu"><li id="topbarLogoutMenu" style="display:none;"><a href="/p/logout">ログアウト</a></li></ul></div>';
			var pager = '<div class="pager"><a href="/a/hoge" class="navi">-hogeの記事に戻る</a><a href="' + basicUrl + '1-" class="navi">&#171; 前へ</a>' +
						'<a href="' + basicUrl + '1-">1-</a><span class="current">31-</span><a href="' + basicUrl + '61-">61-</a>' +
						'<a href="' + basicUrl + '91-">91-</a><a href="' + basicUrl + '61-" class="navi">次へ &#187;</a></div>';
			var mainHtmls = [];
			urlAnalyzer = new c.UrlAnalyzer();
			spyOn(urlAnalyzer, "getNowUrl").and.returnValue(basicUrl + "31-");
			spyOn(urlAnalyzer, "inArticlePage").and.returnValue(false);
			mainHtmls[basicUrl + "1-"] = "<dl>" +
				'<dt class="reshead"><a name="31" class="resnumhead"></a>31 ： <span class="name">ななしのよっしん</span> ：2009/01/11(日) 23:44:16 ID: b6fD7NC5ng</dt>' +
				'<dd class="resbody">NGID</dd></dl>';
			mainHtmls[basicUrl + "31-"] = "<dl>" +
				'<dt class="reshead"><a name="32" class="resnumhead"></a>32 ： <span class="name">NGネーム</span> ：2009/01/11(日) 23:44:16 ID: b6fD7NC5x/</dt>' +
				'<dd class="resbody"><a href="/b/a/name/31-#32" rel="nofollow" target="_blank" class="dic">&gt;&gt;32</a></dd></dl>';
			mainHtmls[basicUrl + "61-"] = "<dl>" +
				'<dt class="reshead"><a name="33" class="resnumhead"></a>33 ： <span class="name">ななしのよっしん</span> ：2009/01/11(日) 23:44:16 ID: b6fD7NC5x/</dt>' +
				'<dd class="resbody">NGワード</dd></dl>';
			mainHtmls[basicUrl + "91-"] = "<dl>" +
				'<dt class="reshead"><a name="34" class="resnumhead"></a>34 ： <span class="name">31</span> ：2009/01/11(日) 23:44:16 ID: b6fD7NC5x/</dt>' +
				'<dd class="resbody"><a href="/b/a/name/91-#32" rel="nofollow" target="_blank" class="dic">&gt;&gt;32-33</a></dd></dl>';
			htmls = [];
			for(url in mainHtmls){
				htmls[url] = htmlHead + barHtml + "<div id='bbs'>" + pager + mainHtmls[url] + pager + "</div>" + htmlTail;
			}
			$("body").append("<div id='sandbox'></div>");
			$("#sandbox").append(barHtml + "<div id='bbs'>" + pager + mainHtmls[basicUrl + "31-"] + pager + "</div>");
			jasmine.clock().install();
			spyOn($, "get").and.callFake(function(url, callback){
				callback(htmls[url]);
			});
		});
	
		it("一連の動作が動く", function(){
			//exercise
			c.main(urlAnalyzer);
			//verify
			expect($("#bbs dl dt div").hasClass("ID")).toEqual(true);
			$("#bbs dl dd a.dic").trigger("mouseenter");
			expect($("span.numTooltip > div .reshead").size()).toEqual(1);
			$("#bbs dl dd a.dic").trigger("mouseleave");
			$("#bbs dl dt div.ID").trigger("mouseenter");
			expect($("#bbs dl dt div.ID").find(".reshead").size()).toEqual(1);
			$("#bbs dl dt div.ID").trigger("mouseleave");
			$("#bbs dl dt div.ID").trigger("click");
			expect($("#bbs dl dt #contextMenu").size()).toEqual(1);
			expect($("#bbs dl dt").hasClass("deleted")).toEqual(false);
			$("#bbs dl dt #contextMenu #ngidMenu").trigger("click");
			expect($("#bbs dl dt").hasClass("deleted")).toEqual(true);
			expect($("#loading").size()).toEqual(0);
			expect($(".pager #loadPreviousPageLinks").size()).toEqual(1);
			expect($("#loadPreviousPageLinks").size()).toEqual(1);
			$(".pager #loadPreviousPageLinks").trigger("click");
			expect($("#bbs dl dt").size()).toEqual(2);
			expect($("#loadPreviousPageLinks").size()).toEqual(0);
			expect($("#loadNextPageLinks").size()).toEqual(1);
			$(".pager #loadNextPageLinks").trigger("click");
			expect($("#bbs dl dt").size()).toEqual(3);
			$(window).scrollTop(1000);
			$(window).trigger("scroll");
			expect($("#bbs dl dt").size()).toEqual(3);
			jasmine.clock().tick(1000);
			expect($("#bbs dl dt").size()).toEqual(4);
			expect($("#bbs dl dt").eq(1).html()).toMatch(/\[1\/3\]/);
			expect($("#bbs dl dt").eq(1).find("div").hasClass("IDMulti")).toEqual(true);
			expect($("#loadNextPageLinks").size()).toEqual(0);
			expect($("#bbs dl dt.deleted").size()).toEqual(3);
			expect($("#bbs").css("display")).toEqual("block");
			expect($("#ng").css("display")).toEqual("none");
			expect($("#topbarRightMenu #bbsLi").hasClass("selected")).toEqual(true);
			expect($("#topbarRightMenu #ngLi").hasClass("selected")).toEqual(false);
			$("#topbarRightMenu #ngLi").trigger("click");
			expect($("#bbs").css("display")).toEqual("none");
			expect($("#ng").css("display")).toEqual("block");
			expect($("#topbarRightMenu #bbsLi").hasClass("selected")).toEqual(false);
			expect($("#topbarRightMenu #ngLi").hasClass("selected")).toEqual(true);
			$("#ngidTextarea").val("");
			$("#decideNG").trigger("click");
			expect($("#bbs dl dt.deleted").size()).toEqual(0);
			$("#bbs dl dd").eq(3).find("a.dic").trigger("mouseenter");
			expect($("#bbs dl dd").eq(3).find("span.numTooltip > div .reshead").size()).toEqual(2);
			$("#bbs dl dd").eq(3).find("a.dic").trigger("mouseleave");
			$("#bbs dl dd").eq(1).find("a.dic").trigger("mouseenter");
			expect($("#bbs dl dd").eq(1).find("span.numTooltip > div .reshead").size()).toEqual(1);
			$("#bbs dl dd").eq(1).find("a.dic").trigger("mouseleave");
			$("#topbarRightMenu #bbsLi").trigger("click");
			//tearDown
			$("#sandbox").remove();
			$("#defCss").remove();
			$("#nicoDicBBSViewerCSS").remove();
			jasmine.clock().uninstall();
		});
	});
});
