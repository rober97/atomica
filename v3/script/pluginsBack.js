/* Chatwoot — support widget (reemplaza Intercom). */
var CHATWOOT_BASE_URL = "https://chat.unabase.com";
var CHATWOOT_WEBSITE_TOKEN = "6EXpUGtfZt2WzoovwNyx3xRp"; // inbox "V4" (compartido con unabasev3front)

function _loadChatwootSDK(onReady) {
    if (window.$chatwoot) { onReady(); return; }
    if (window._chatwootReadyQueue) {
        window._chatwootReadyQueue.push(onReady);
        return;
    }
    window._chatwootReadyQueue = [onReady];
    window.addEventListener("chatwoot:ready", function () {
        var queued = window._chatwootReadyQueue || [];
        window._chatwootReadyQueue = null;
        queued.forEach(function (cb) { try { cb(); } catch (e) { /* noop */ } });
    });
    var s = document.createElement("script");
    s.type = "text/javascript";
    s.defer = true;
    s.async = true;
    s.src = CHATWOOT_BASE_URL + "/packs/js/sdk.js";
    s.onload = function () {
        window.chatwootSDK.run({
            websiteToken: CHATWOOT_WEBSITE_TOKEN,
            baseUrl: CHATWOOT_BASE_URL
        });
    };
    var x = document.getElementsByTagName("script")[0];
    x.parentNode.insertBefore(s, x);
}

/* Expuesto para que unabase.js refresque los atributos de pagina actual en
   cada navegacion SPA (loadInto.viewport). */
window.unaChatwoot = {
    refreshPage: function () {
        try {
            if (!window.$chatwoot) return;
            window.$chatwoot.setCustomAttributes({
                current_page: window.location.href,
                page_title: document.title
            });
        } catch (e) { /* noop */ }
    }
};

const chatwoot = (company) => {
    _loadChatwootSDK(function () {
        var descParts = [];
        if (companyRut) descParts.push('RUT ' + companyRut);
        if (company && company.website) descParts.push(company.website);

        var attrs = {
            name: `${currentUser.name}`,
            email: currentUser.email,
            company_name: companyName || undefined,
            description: descParts.join(' · ') || undefined
        };
        // Sin identifier_hash, Chatwoot descarta en silencio company_name/description
        // porque el inbox "V4" tiene Identity Validation activo. El hash se calcula
        // en 4D (HMAC-SHA256 con el Secret Key del inbox) y llega inline en la pagina
        // como chatwootIdentifierHash — el secreto nunca toca el frontend.
        if (typeof chatwootIdentifierHash !== 'undefined' && chatwootIdentifierHash) {
            attrs.identifier_hash = chatwootIdentifierHash;
        }

        window.$chatwoot.setUser(currentUser.username, attrs);
        window.$chatwoot.setCustomAttributes({
            company_rut: companyRut || undefined,
            company_website: base_url,
            current_page: window.location.href,
            page_title: document.title
        });
    });
}

let company = ""
if(typeof companyRut != 'undefined' && companyRut != null){
    //console.log(`companyRut:: ${companyRut}`)
    company = {
        id: companyRut,
        name: companyName,
        website: base_url
    }
}

chatwoot(company)


let ufUrls = {
    url: 'https://api.sbif.cl/api-sbifv3/recursos_api/uf?apikey=ce567cb4db4d6a3daf4b560d142519f584525d2d&formato=json',
    provider: 'Superintendencia de Bancos e Instituciones Financieras de Chile ',
    urlProvidor: 'sbif.cl'
}
//var uf = "27.205,99"
let separatorTransform = number => {
    let index = number.indexOf(',')
    let noDecimals = number.slice(0,index)
    let final = noDecimals.replace('.','')+'.'+number.slice(index+1)
    return parseFloat(final)

}

const percentage = (total, part) => {
    return ((part / total) * 100).toFixed(2)
}
if(typeof reqUrl !== 'undefined'){
    if(reqUrl !== "" && reqUrl !== null){
        // 	// window.location.replace(nodeUrl+'/agentControl/false');
        // 	//
        // 
        window.location.replace(nodeUrl+reqUrl);
    }
}

let today = new Date()
// 	
if(dateString(today).txtDate != currency.ufUpdate && currency.code == 'CLP'){

    currency.cl.uf.update()
}