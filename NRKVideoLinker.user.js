// ==UserScript==
// @name         NRK link intercept
// @namespace    https://github.com/SondreKindem
// @version      1.0
// @description  Adds a button that copies the video m3u3 playlist to clipboard
// @author       Sonkin
// @homepage     https://github.com/SondreKindem/NRKVideoLinker
// @match        https://tv.nrk.no/serie/*
// @match        https://tv.nrk.no/program/*
// @icon         https://www.google.com/s2/favicons?domain=nrk.no
// @require      https://raw.githubusercontent.com/sizzlemctwizzle/GM_config/master/gm_config.js
// @grant        GM_getValue
// @grant        GM_setValue
// ==/UserScript==

(function() {
    'use strict';

    let foundUrl = ""
    let allUrlsFound = []

    initGMConfig()

    window.onload = (event) => {
        console.log("Initializing NRK link intercept")
        initCSS()
        createButton()
        XMLHttpRequest.prototype.realOpen = XMLHttpRequest.prototype.open;

        var myOpen = function(method, url, async, user, password) {
            // Intercept all http requests and check for m3ur playlist
            if(url.includes("playlist")){
                console.log("FOUND URL!")
                console.log(url)

                document.getElementById("nrkInterceptorError").innerText = ""
                const node = document.getElementById("nrkInterceptorLink")
                if(window.location.href.startsWith("https://tv.nrk.no/program")){
                    console.log("THIS IS A MOVIE")
                    node.innerHTML = "<p style='margin-bottom: 0'>" + url + "</p>"

                    const title = document.getElementsByClassName("tv-program-header__title")[0].innerText
                    const btnWrap = document.createElement("div")
                    const copyYtDlBtn = document.createElement("button")
                    copyYtDlBtn.innerText = "Kopier yt-dl cmd"
                    copyYtDlBtn.addEventListener("click", () => copyEpisodeYtDl(url, copyYtDlBtn, title))
                    btnWrap.appendChild(copyYtDlBtn)
                    node.appendChild(btnWrap)

                    foundUrl = url
                    copyLink(url)
                } else {
                    console.log("THIS IS A SERIES")
                    const selectedEpNode = document.getElementsByClassName("tv-series-episode-list-item--selected")
                    const title = selectedEpNode[0].getElementsByClassName("tv-series-episode-list-item__title")[0].innerText
                    muteNpause()
                    const newNode = document.createElement("div")

                    allUrlsFound.push({url: url, title: title})
                    document.getElementById("nrkInterceptorDlAll").classList.remove("hidden")

                    if(selectedEpNode){
                        newNode.innerHTML = "<span>" + title + "</span><br/>"
                    } else {
                        newNode.innerHTML = "<span>" + url + "</span><br/>"
                    }

                    const copyBtn = document.createElement("button")
                    copyBtn.innerText = "Kopier link"
                    copyBtn.style = "margin-right: 10px"
                    copyBtn.addEventListener("click", () => copyEpisodeLink(url, copyBtn))

                    const copyYtDlBtn = document.createElement("button")
                    copyYtDlBtn.innerText = "Kopier yt-dl"
                    copyYtDlBtn.addEventListener("click", () => copyEpisodeYtDl(url, copyYtDlBtn, title))

                    newNode.appendChild(copyBtn)
                    newNode.appendChild(copyYtDlBtn)
                    node.appendChild(newNode)
                }
            }

            //call original
            this.realOpen (method, url, async, user, password);
        };

        //ensure all XMLHttpRequests use our custom open method
        XMLHttpRequest.prototype.open = myOpen ;
    };

    /**
     * Insert download button & set click eventlistener
     */
    function createButton() {
        if(document.getElementById("nrkInterceptor")) {
            return
        }

        console.log("NRK link intercept: Adding button")
        const btnContainer = document.getElementById("sfMain")

        // Create button
        const node = document.createElement("div")
        node.id = "nrkInterceptor"
        node.innerHTML =
            "<h4 id='nrkInterceptorHeader'>NRK link intercept <span id='nrkInterceptorHeaderSettings'>⚙</span> <span id='nrkInterceptorHeaderToggle'>☰</span></h4>" +
            "<div id='nrkInterceptorError'></div>" +
            "<button id='nrkInterceptorCopy'>" +
            "   Kopier video m3u3" +
            "</button>" +
            "<div id='nrkInterceptorLink'>" +
            "   <button id='nrkInterceptorDlAll' class='hidden'>Yt-dl for alle (powershell)</button>" +
            "</div>" +
            "<div id='nrkInterceptorOverlay' class='hidden'></div>"

        const miniNode = document.createElement("div")
        miniNode.id = "nrkInterceptorMinified"
        miniNode.className = "nrkInterceptor-hidden"
        miniNode.innerHTML = "☰"
        miniNode.addEventListener("click", toggleHide)

        btnContainer.appendChild(node)
        btnContainer.appendChild(miniNode)
        document.getElementById("nrkInterceptorCopy").addEventListener("click", runProgram)
        document.getElementById("nrkInterceptorHeaderToggle").addEventListener("click", toggleHide)
        document.getElementById("nrkInterceptorHeaderSettings").addEventListener("click", openSettings)
        document.getElementById("nrkInterceptorDlAll").addEventListener("click", copyAllEpisodeYtDl)
    }

    function startNstop(){
        if(foundUrl){
            copyLink(foundUrl)
            return;
        }
        const playBtn = document.getElementsByClassName("ludo-poster--playable")[0]
        console.log(playBtn)
        playBtn.click()
        muteNpause()
    }

    function muteNpause(){
        if(!isMuted()){
            const muteBtn = document.getElementsByClassName("ludo-bar__button--volume")[0]
            muteBtn.click()
        }
        setTimeout(function () {
            const pauseBtn = document.getElementsByClassName("ludo-bar__button--pause")[0]
            pauseBtn.click()
        }, 2000);
    }

    function openSettings(){
        GM_config.open();
    }

    function runProgram() {
        if(window.location.href.startsWith("https://tv.nrk.no/program")){
            startNstop()
        } else {
            startNstop()
        }
    }

    function toggleHide(){
        console.log("cløick")
        document.getElementById("nrkInterceptorMinified").classList.toggle("nrkInterceptor-hidden")
        document.getElementById("nrkInterceptor").classList.toggle("nrkInterceptor-hidden")
    }

    function isMuted() {
        return document.getElementsByClassName("nrk-media-volume--muted").length > 0
    }
    function isPaused() {
        return document.getElementsByClassName("ludo-bar__button--play").length > 0
    }

    /**
     * Copy link to clipboard
     */
    function copyLink(url){
        if(!url){
            console.log("NO URL")
            document.getElementById("nrkInterceptorError").innerText = "Ingen url funnet"
        } else {
            document.getElementById("nrkInterceptorError").innerText = ""
            console.log(url)
            navigator.clipboard.writeText(url).then(function() {
                document.getElementById("nrkInterceptorCopy").innerText = "Kopiert 👍"
            }, function(err) {
                document.getElementById("nrkInterceptorCopy").innerText = "Kunne ikke kopiere ❌"
                document.getElementById("nrkInterceptorError").innerText = err
            })
        }
    }

    function copyEpisodeLink(url, element) {
        if(!url){
            console.log("NO URL")
            element.innerText = "Ingen url funnet"
        } else {
            document.getElementById("nrkInterceptorError").innerText = ""
            console.log(url)
            navigator.clipboard.writeText(url).then(function() {
                element.innerText = "Kopiert 👍"
            }, function(err) {
                element.innerText = "Kunne ikke kopiere ❌"
                document.getElementById("nrkInterceptorError").innerText = err
            })
        }
    }

    function copyEpisodeYtDl(url, element, title){
        if(!url){
            console.log("NO URL")
            element.innerText = "Ingen url funnet"
        } else {
            const exe = GM_config.get('executable');
            document.getElementById("nrkInterceptorError").innerText = ""
            const textToCopy = exe + ' -o "' + title + '.%(ext)s" "' + url + '"'
            navigator.clipboard.writeText(textToCopy).then(function() {
                element.innerText = "Kopiert 👍"
            }, function(err) {
                element.innerText = "Kunne ikke kopiere ❌"
                document.getElementById("nrkInterceptorError").innerText = err
            })
        }
    }

    function copyAllEpisodeYtDl(){
        const btn = document.getElementById("nrkInterceptorDlAll")

        if(allUrlsFound.length == 0){
            console.log("NO URL")
            btn.innerText = "Ingen url funnet"
        } else {
            const exe = GM_config.get('executable');
            let fullCommand = ""
            for(const link of allUrlsFound){
                document.getElementById("nrkInterceptorError").innerText = ""
                const textToCopy = exe + ' -o "' + link.title + '.%(ext)s" "' + link.url + '" ; '
                fullCommand += textToCopy
            }
            navigator.clipboard.writeText(fullCommand).then(function() {
                btn.innerText = "Kopiert 👍"
            }, function(err) {
                btn.innerText = "Kunne ikke kopiere ❌"
                document.getElementById("nrkInterceptorError").innerText = err
            })
        }
    }

    function initGMConfig() {
        var frame = document.createElement('div');
        document.body.appendChild(frame);
        GM_config.init(
            {
                'id': 'config', // The id used for this instance of GM_config
                'title': 'NRK link intercept settings', // Panel Title
                'fields': // Fields object
                {
                    'executable': // This is the id of the field
                    {
                        'label': 'Youtube-dl executable', // Appears next to field
                        'type': 'text', // Makes this setting a text field
                        'default': '.\\youtube-dl' // Default value if user doesn't change it
                    }
                },
                'css': '#config { width: 300px !important; padding: 15px !important; inset: 50px 50px auto auto !important; }', // CSS that will hide the section
                'frame': frame // Element used for the panel
            });
    }

    /**
     * Add css to page
     */
    function initCSS() {
        const ele = document.createElement('style');
        ele.innerHTML = `
#nrkInterceptor {
  position: fixed;
  top: 50px;
  right: 50px;
  width: 230px;
  min-height: 60px;
  max-height: calc(100vh - 200px);
  background: white;
  z-index: 999;
  overflow-y: auto;
  overflow-x: hidden;
  border-radius: 5px;
  box-shadow: rgba(0, 0, 0, 0.2) 0px 7px 29px 0px;
}
#nrkInterceptorMinified {
  position: fixed;
  top: 50px;
  padding: 10px;
  right: 50px;
  background: white;
  z-index: 999;
  border-radius: 5px;
  box-shadow: rgba(0, 0, 0, 0.2) 0px 7px 29px 0px;
  cursor: pointer;
}
#nrkInterceptorHeaderToggle, #nrkInterceptorHeaderSettings {
  cursor: pointer;
}
.nrkInterceptor-hidden {
  display: none
}
#nrkInterceptorError {
  color: red;
}
#nrkInterceptorCopy {
  background-color: #4CAF50; /* Green */
  border: none;
  width: 230px;
  color: white;
  padding: 15px 32px;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 16px;
  cursor: pointer;
}
#nrkInterceptorDlAll {
  margin-top: 10px;
  width: 230px;
  padding: 5px;
  border: none;
  cursor: pointer;
}
#nrkInterceptorDlAll:hover {
  background-color: lightgray
}
#nrkInterceptorCopy:hover {
  background-color: #3e8e41; /* Green */
}
#nrkInterceptorLink > * {
  padding: 10px
}
#nrkInterceptorHeader {
  padding: 10px;
  margin: 0;
  display: flex;
  justify-content: space-between
}
#nrkInterceptorOverlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
  pointer-events: none;
}
.hidden {
  display: none
}
button {
  cursor: pointer;
}
`;
        document.head.appendChild(ele);
    }
})();
