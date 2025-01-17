// Comment or uncomment this for production / dev
console.log = function(){};
var cachingData = new function () {
    // Constants:
    var LAST_CHECKED = "lastChecked",
        CACHED_DRIBBLE_DATA = "cachedDribbbleData",
        USERNAME = "username";

    var storageAPI = window.localStorage,
        self = this;

    self.getLastTimeChecked = function () {
        return storageAPI.getItem(LAST_CHECKED) ? new Date(storageAPI.getItem(LAST_CHECKED)) : null;
    };

    self.getCachedShots = function () {
        return storageAPI.getItem(CACHED_DRIBBLE_DATA) ? JSON.parse(storageAPI.getItem(CACHED_DRIBBLE_DATA)) : null;
    };

    self.getUsername = function () {
        return storageAPI.getItem(USERNAME);
    };

    self.setLastChecked = function (date) {
        console.log("Updating last checked", date);
        storageAPI.setItem(LAST_CHECKED, date);
    };

    self.setCachedShots = function (jsonData) {
        // console.log("Updating cached shots", jsonData);
        storageAPI.setItem(CACHED_DRIBBLE_DATA, jsonData);
    };

    self.setUsername = function (username) {
        console.log("Updating username", username);
        storageAPI.setItem(USERNAME, username);
    };

    // clears all the local storage items:
    self.clearCache = function () {
        console.log("clearing cache");
        storageAPI.clear();
    };
};

var showing = 0,
    user = $('#lookup-player'),
    themeInput = $('#toggle'),
    userName = cachingData.getUsername(),
    shotcount = 12,
    page = 1,
    current = localStorage.getItem('current');

var drib = {
    host:'http://api.dribbble.com',
    popular:'/shots/popular',
    everyone:'/shots/everyone',
    debuts:'/shots/debuts',
    player:'/players/',
    shot:'/shots/',

    /* ================================
     Rewriting call function
     =================================*/

    add:function (page, from, how) {
        console.log('page ' + page)
        if (from === 'popular') {
            var url = drib.host + drib.popular + "?per_page=" + shotcount + "&page=" + page;
            console.log('####' + url);
            var yql = 'https://query.yahooapis.com/v1/public/yql?q=' + encodeURIComponent('select * from json where url="' + url + '"') + '&format=json&callback=cbfunc';
            console.log(yql);
        } else if (from === 'debuts') {
            var url = drib.host + drib.debuts + "?per_page=" + shotcount + "&page=" + page;
            var yql = 'https://query.yahooapis.com/v1/public/yql?q=' + encodeURIComponent('select * from json where url="' + url + '"') + '&format=json&callback=cbfunc';
            console.log('####' + url);
        } else if (from === 'everyone') {
            var url = drib.host + drib.everyone + "?per_page=" + shotcount + "&page=" + page;
            var yql = 'https://query.yahooapis.com/v1/public/yql?q=' + encodeURIComponent('select * from json where url="' + url + '"') + '&format=json&callback=cbfunc';
            console.log('####' + url);
        } else {
            playerId = from;
            if (how === 'new') {
                $('.subInfo').show().html("<span style='color:#68a4f5'>searching...<span>");
            }
            var url = drib.host + drib.player + playerId + '/shots/following' + '?per_page=' + shotcount + '&page=' + page;
            console.log('####' + url);
            var yql = 'https://query.yahooapis.com/v1/public/yql?q=' + encodeURIComponent('select * from json where url="'+url+'"')+'&format=json&callback=cbfunc';
        }
        this.req(yql, function (data) {
//            console.log('how:'+ how);
            if (page === 1) {
                getShots.getAd();
            }
            getShots.buildShots(data.query.results.json.shots, how);

        });
    },

    req:function (url, cbfunc) {
        $.ajax({
            url:url,
            dataType:'jsonp',
            jsonp:false,
            jsonpCallback:'cbfunc',
            timeout:15000,
            success:function (data) {
                cachingData.setLastChecked(new Date());
                cachingData.setCachedShots(JSON.stringify(data));
                OnSuccess(data);
            },
            error:function (x, t, m) {
                if (t === "timeout") {
                    drib.showError("We're sorry, we couldn't find that username.  We'll show you the popular shots in the meantime");
                    console.log('timeout error');
                    return;
                } else {
                    $('#lookup-player').addClass('error');
                    drib.showError("We're sorry, we couldn't find that username.  We'll show you the popular shots in the meantime");
                    console.log('else timeout error');
                    --page;
                    return;
                }
            }
        });

        function OnSuccess(data) {
            var userName = cachingData.getUsername();
            $('.subInfo').hide();
            cbfunc(data);
        }
    },

    showError:function (errorMessage) {
        // data is tainted so clear cache:
        //cachingData.clearCache();

        $('#lookup-player').removeClass('playerList').addClass('error');
        $('.subInfo').html("<span style='color:#ce4d73'>" +
            errorMessage +
            "<span>");
    },

    settings:function (tog, cl) {
        if (tog == 'in') {
            if (cl == 'signin') {
                $(".settings").addClass('active');
            } else {
                $(".settings").addClass('active').siblings().removeClass('active');
            }
            $('.subInfo').hide();
            $(".settingsPop").fadeIn(250);
            $(".overlay").fadeIn(250);
            $('#picsList').addClass('blur');
            $(".settingsPop").removeClass('out').addClass('in').show();
        }
        if (tog == 'out') {
            $('.subInfo').hide();
            $(".settingsPop").delay(150).fadeOut(250);
            $('#picsList').removeClass('blur');
            $('.overlay').fadeOut(100);
            $(".settingsPop").removeClass('in').addClass('out');

            drib.activeNav();
        }
    },
    userNav:function (tog) {
        if (tog == 'following') {
            $('#self').html('Following').addClass('following').removeClass('signIn');
        }
        if (tog == 'signin') {
            $('#self').html('Sign In').addClass('signIn').removeClass('following');
        }
    },
    activeNav:function () {
        var navli = $('.nav li');
        navli.each(function () {
            //console.log('current:'+ current);
            //console.log('id:' +$(this).attr("id"));
            if ($(this).attr('id') == current) {
                $($(this)).addClass('active').siblings().removeClass('active');
            } else {
                $('.following').addClass('active').siblings().removeClass('active');
            }
        });
    },
    activeTheme:function() {
        var theme = localStorage.getItem('theme');
        if(!theme){
            $('body').removeClass('dark').addClass('white');
            themeInput.prop('checked', false);
        }
        else if(theme === 'dark') {
            $('body').removeClass('white').addClass('dark');
            themeInput.prop('checked', true);
        } else {
            $('body').removeClass('dark').addClass('white');
            themeInput.prop('checked', false);
        }
    }
};
var singleShot = '';
var getShots = {
    container:$('#picsList'),
    getAd: function() {
        //insert add into a random position 2 per 11
        
        var ad = 'CK7IP';
        $.ajax({
            type:'get',
            url:'https://srv.buysellads.com/ads/' + ad + '.json',
            success:Success,
            error:Error,
            dataType:'jsonp'
        });
        function Success(res) {
            if(res.ads[0].statlink) {
                clickUrl = res.ads[0].statlink;
            } else {
                clickUrl = res.ads[0].statlink_default;
            } 
            var adId = res.ads[0].shotId,
                //clickUrl = if(res.ads[0].statlink) {res.ads[0].statlink} else {res.ads[0].statlink_default},
                clickId = clickUrl.substring(clickUrl.lastIndexOf('/') + 1),
                shotUrl = drib.host + drib.shot + adId,
                yql = 'https://query.yahooapis.com/v1/public/yql?q=' + encodeURIComponent('select * from json where url="' + shotUrl + '"') + '&format=json&callback=cb',
                html = res.ads[0].html;

                singleShot += '' + res.ads[0].html + '<div id="ad" class="animate fadeInUp item"><div id="fusion_ad" data-clickid="' + clickId + '">' +
                '       <a class="poweredBy" href="http://fusionads.net">Powered by Fusion</a>' +
                '   </div>';
                '</div>';
        }
    },
    buildShots:function (shots, how) {
        var imgs = '';
        for (var i = 0; i < shotcount && shots && i < shots.length; i++) {
            //console.log(shots[i]);
            if (shots[i].image_400_url) {
                var shotsImg = shots[i].image_400_url;
            } else {
                var shotsImg = shots[i].image_url;
            }
            imgs += '<div class="animate fadeInUp item">' +
                //  style="-webkit-animation-delay: ' + i * 150 + 'ms;" <!-- animation styles
                '    <div class="picture" style="background-image:url(' + shotsImg + ');">' +
                //'        <img class="shot" src="' + shots[i].image_url + '" />' +
                '       <div class="gradient"><a class="link" href="' + shots[i].url + '"></a></div>' +
                '        <div class="underlay">' +
                //'            <a class="r round" href="' + shots[i].url + '"><img src="css/img/arrow.png" /></a>' +
                '            <a class="i round" href="' + shots[i].player.url + '"><img src="' + shots[i].player.avatar_url + '" /></a>' +

                '           <div class="shotStats">' +
                '              <span class="name"><a href="' + shots[i].player.url + '">' + shots[i].player.name + '</a></span>' +
                '              <span class="likes">' + shots[i].likes_count + ' Likes &middot; ' + shots[i].comments_count + ' comments</span>' +
                '           </div>' +
                '        </div>' +
                '    </div>' +
                '</div>';
        }
        //       console.log('how:'+ how);
        if (how === 'new') {
            this.container.html(imgs);
        } else {
            this.container.append(imgs);
        }

        var injectAd = function (min, max, ad) {
            var rand = Math.random(); //return a decimal between 0 and 1
            var randSpan = rand * (max - min);
            var floor = Math.floor(randSpan);
            var pos = floor + min + ((page - 1) * 20);

            console.log(singleShot);
            var singleShotId = setInterval(function(){
                if (singleShot == '') {
                    return;
                }
                if(singleShot !== '') {
                    $('#picsList div:nth-child(' + pos + ')').after(singleShot);
                    clearInterval(singleShotId);
                    //_gaq.push(['_trackEvent', 'ad', 'populated ad', adId]);
                }
            }, 100);

            //console.log('inject ad');

            // Insert Add Code Here
            //$.ajax({
            //    type:'get',
            //    url:'https://srv.buysellads.com/ads/' + ad + '.json',
            //    success:Success,
            //    error:Error,
            //    dataType:'jsonp'
            //});
            //function Success(res) {
//
            //    //console.log(res);
//
            //    /*if (!res.ads[0].shotId) {
            //     _gaq.push(['_trackEvent', 'ad', 'api no response', ad]);
            //     return;
            //     }*/
//
            //    if(res.ads[0].statlink) {
            //        clickUrl = res.ads[0].statlink;
            //    } else {
            //        clickUrl = res.ads[0].statlink_default;
            //    } 
            //    var adId = res.ads[0].shotId,
            //        //clickUrl = if(res.ads[0].statlink) {res.ads[0].statlink} else {res.ads[0].statlink_default},
            //        clickId = clickUrl.substring(clickUrl.lastIndexOf('/') + 1),
            //        shotUrl = drib.host + drib.shot + adId,
            //        yql = 'https://query.yahooapis.com/v1/public/yql?q=' + encodeURIComponent('select * from json where url="' + shotUrl + '"') + '&format=json&callback=cb',
            //        html = res.ads[0].html;
//
//
            //    //console.log('AD ####'+ shotUrl);
//
//
            //    $.ajax({
            //        url:yql,
            //        dataType:'jsonp',
            //        jsonp:true,
            //        jsonpCallback:'cb',
            //        timeout:1000,
            //        success:function (data) {
            //            //console.log(data);
            //            var shotStr = data.query.results.json,
            //                singleShot = '';
            //            //console.log(shotStr);
            //            //console.log(res.ads[0].image);
            //            if(res.ads[0].image) {
            //                singleShot += '<div id="ad" class="animate fadeInUp item">' +
            //                '   <div id="fusion_ad" data-clickid="' + clickId + '">' +
            //                '       <span class="fusionentire">'+
            //                '           <a href="'+ res.ads[0].link+'" target="_blank">' +
            //                '               <img src=" '+ res.ads[0].image +' " class="fusionimg"  border="0" height="100" width="130">' +
            //                '           </a>' +
            //                '       <a href="'+ res.ads[0].link +'" class="fusiontext" title='+ res.ads[0].title +'" target="_top"> '+ res.ads[0].title +' </a>' +
            //                '       <p>'+ res.ads[0].description +'</p>'+
            //                '       </span>'+    
            //                '       <a class="poweredBy" href="http://buysellads.com/buy/detail/173658">Your Ad Here</a>' +
            //                '   </div>';
            //                '</div>';
            //            } else {
            //                singleShot += '' + res.ads[0].html + '<div id="ad" class="animate fadeInUp item"><div id="fusion_ad" data-clickid="' + clickId + '">' +
            //                    '       <a class="poweredBy" href="http://fusionads.net">Powered by Fusion</a>' +
            //                    '   </div>';
            //                '</div>';
            //            }
            //            $('#picsList div:nth-child(' + pos + ')').after(singleShot);
            //            _gaq.push(['_trackEvent', 'ad', 'populated ad', adId]);
//
//
            //        },
            //        error:function (x, t, m) {
            //            return;
            //        }
//
            //    });
            //}
//
            //function Error(response) {
            ////    console.log('calling error', response);
//
//            }
        };

        //console.log('call ad injection' + page);
        if (page === 1) {
            var minRand = 3;
            var maxRand = 12;
            injectAd(minRand, maxRand);
        }
    }
};

var ui = {
    init:function () {
        
        $('.nav li').on('click', function () {
            var from = $(this).attr("id");

            // Highlight Active Nav Item
            $(this).addClass('active').siblings().removeClass('active');

            // Show Login if user needs to sign in
            if (from === 'self' && $(this).hasClass('signIn')) {
                drib.settings('in', 'signin');
                return;
            } else if (from === 'self' && $(this).hasClass('following')) {
                console.log('userName' + userName);
                from = userName;
            }
            if (from === 'settings') {
                return;
            }

            window.localStorage.setItem('current', from);
            $("html, body").animate({ scrollTop:0 }, 600);
            //window.localStorage.setItem('load', from);
            page = 1;
            drib.add(page, from, 'new');
        });

        user.bind('blur keyup', function (event) {
            if (event.type === 'keyup' && event.keyCode !== 13 && event.keyCode !== 10) return;
            if (!$(this).val()) {
                window.localStorage.setItem('username', '');
                window.localStorage.setItem('load', 'popular');
                window.localStorage.setItem('current', 'popular');
                drib.userNav('signin');
                drib.add(page, 'popular', 'new');
            } else {
                var playerId = $(this).val();
                $('.subInfo').show().html("<span style='color:#68a4f5'>searching...<span>");
                var url = drib.host + drib.player + playerId + '/shots/following';
                var yql = 'https://query.yahooapis.com/v1/public/yql?q=' + encodeURIComponent('select * from json where url="' + url + '"') + '&format=json&callback=cbuser';
                console.log('####' + yql);
                $.ajax({
                    url:yql,
                    dataType:'jsonp',
                    jsonp:true,
                    jsonpCallback:'cbuser',
                    timeout:1000,
                    success:function (data) {
                        if (data.query.results.message === "Not found") {
                            $('#lookup-player').addClass('error');
                            drib.showError("We're sorry, we couldn't find that username.  We'll show you the popular shots in the meantime");
                            window.localStorage.setItem('username', '');
                            window.localStorage.setItem('load', 'popular');
                            window.localStorage.setItem('current', 'popular');
                            drib.userNav('signin');
                            page = 1;
                            drib.add(page, 'popular', 'new');
                            return;
                        }
                        console.log(playerId);
                        window.localStorage.setItem('username', playerId);
                        window.localStorage.setItem('load', playerId);
                        window.localStorage.setItem('current', playerId);
                        console.log(userName);
                        drib.userNav('following');
                        page = 1;
                        drib.add(page, playerId, 'new');

                    },
                    error:function (x, t, m) {
                        $('#lookup-player').addClass('error');
                        drib.showError("We're sorry, we couldn't find that username.  We'll show you the popular shots in the meantime");
                        window.localStorage.setItem('username', '');
                        window.localStorage.setItem('load', 'popular');
                        window.localStorage.setItem('current', 'popular');
                        drib.userNav('signin');
                        page = 1;
                        drib.add(page, 'popular', 'new');
                        return;
                    }
                });
            }
        });
        
        themeInput.click(function(){
            if(themeInput.is(':checked')) {
                window.localStorage.setItem('theme', 'dark');
                $('body').removeClass('white').addClass('dark');
            } else {
                window.localStorage.setItem('theme', 'white');
                $('body').removeClass('dark').addClass('white');
            }
        });

        //On load 
        user.val(userName);
        /*if (!userName) {
         window.localStorage.setItem('current', 'popular');
         } else {
         window.localStorage.setItem('current', userName);
         }*/

    }
};

$(function () {
    //console.log('initialize');
    ui.init();

    if (!userName) {
        window.localStorage.setItem('current', 'popular');
        drib.userNav('signin');
        drib.add(page, 'popular', 'new');
    } else {
        window.localStorage.setItem('current', userName);
        drib.userNav('following');
        drib.add(page, userName, 'new');
    }

    // Set Active Nav Class
    drib.activeNav();
    drib.activeTheme();

    addshots = setInterval(function () {
        //console.log('adding shots');
        a = $(document).height(),
            b = $(window).height(),
            c = $(window).scrollTop();
        diff = b + c;
        // only load more if there have been loaded some before:

        if (diff >= a - 1205 && $('#picsList').height() > 0) {
            from = localStorage.getItem('current');
            what = $("#what").text();
            page++;
            drib.add(page, from);

        }
    }, 500);

    $('.subInfo').hide();

    // settings button clicked:
    $('.head').on('click', '.settings', function () {
        drib.settings('in');
    });

    // click to close settings menu
    $(window).on('click', '.overlay', function () {
        drib.settings('out');
    });

    $('#picsList').on('click', 'div#fusion_ad', function () {
        var featClickId = $(this).attr('data-clickid'),
            featShotId = $(this).attr('data-shotId');
        _gaq.push(['_trackEvent', 'ad', 'featured clicked', 'fusionClicked']);
        console.log('featured clicked ' + featClickId);
        $.ajax({
            type:'post',
            url:'https://srv.buysellads.com/ads/click/x/' + featClickId + '?redirect=no',
            //success:Success,
            //error: Error,
            dataType:'jsonp'
        });
    })
});

var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-34206804-3']);
_gaq.push(['_trackPageview']);

(function () {
    var ga = document.createElement('script');
    ga.type = 'text/javascript';
    ga.async = true;
    ga.src = 'https://ssl.google-analytics.com/ga.js';
    var s = document.getElementsByTagName('script')[0];
    s.parentNode.insertBefore(ga, s);
})();

/*(function(){
 var fusion = document.createElement('script');
 fusion.src = 'https://adn.fusionads.net/api/1.0/ad.js?zoneid=238&rand=' + Math.floor(Math.random()*9999999);
 fusion.async = true;
 (document.head || document.getElementsByTagName('head')[0]).appendChild(fusion);
 })();*/