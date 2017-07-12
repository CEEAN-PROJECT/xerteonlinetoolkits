//TODO: get user email, more verbs (passed/failed, completed, ect), define scormmode for xAPI

function makeId(page_nr, ia_nr, ia_type, ia_name)
{
    var tmpid = 'urn:x-xerte:p-' + (page_nr + 1);
    if (ia_nr >= 0)
    {
        tmpid += ':' + (ia_nr + 1);
        if (ia_type.length > 0)
        {
            tmpid += '-' + ia_type;
        }
    }

    if (ia_name)
    {
        // ia_nam can be HTML, just extract text from it
        var div = $("<div>").html(ia_name);
        var strippedName = div.text();
        tmpid += ':' + encodeURIComponent(strippedName.replace(/ /g, "_"));
        // Truncate to max 255 chars, this should be 4000
        tmpid = tmpid.substr(0,255);
    }
    return tmpid;
}

function XApiTrackingState()
{
	this.initialised = false;
    this.trackingmode = "full";
    this.mode = "normal";
    this.scoremode = 'first';
    this.nrpages = 0;
    this.toCompletePages = new Array();
    this.completedPages = new Array();
    this.start = new Date();
    this.interactions = new Array();
    this.lo_completed = 0;
    this.lo_passed = 0;
    this.page_timeout = 5000;


    
    this.initialise = initialise;
    this.pageCompleted = pageCompleted;
    this.setPageType = setPageType;
    this.setPageScore = setPageScore;
    this.enterInteraction = enterInteraction;
    this.exitInteraction = exitInteraction;
    this.findPage = findPage;
    this.findInteraction = findInteraction;
    this.findCreate = findCreate;
    this.enterPage = enterPage;
    
    function initialise()
    {
    	
    }

    function pageCompleted(page_nr)
    {
        var sit = state.findPage(page_nr);
        if (sit != null)
        {
            for (i=0; i<sit.nrinteractions; i++)
            {
                var sit2 = state.findInteraction(page_nr, i);
                if (sit2 == null || sit2.duration < 1000)
                {
                    return false;
                }
            }
            if (sit.ia_type=="page" && sit.duration < state.page_timeout)
            {
                return false;
            }
            return true;
        }
        return false;
    }
    
    function enterInteraction(page_nr, ia_nr, ia_type, ia_name, correctoptions, correctanswer, feedback)
    {
    	interaction = new XApiInteractionTracking(page_nr, ia_nr, ia_type, ia_name);
        this.interactions.push(interaction);
    }
    
    function exitInteraction(page_nr, ia_nr, result, learneroptions, learneranswer, feedback)
    {
    	var sit = this.findInteraction(page_nr, ia_nr);
    	sit.exit();

        var temp = false;
        var i = 0;
        for(i; i<state.toCompletePages.length;i++)
        {
            var currentPageNr = state.toCompletePages[i];
            if(currentPageNr == page_nr)
            {
                temp = true;
                break;
            }
        }
        if(temp)
        {
            if (! state.completedPages[i]) {
                var sit = state.findInteraction(page_nr, -1);
                if (sit != null) {
                    if (sit.ia_type == "result") {
                        state.completedPages[i] = true;
                    }
                    else {
                        state.completedPages[i] = state.pageCompleted(page_nr);
                    }
                }
            }
        }


    }
    
    function setPageType(page_nr, page_type, nrinteractions, weighting)
    {
    	var sit = state.findPage(page_nr);
        if (sit != null)
        {
            sit.ia_type = page_type;

            sit.nrinteractions = nrinteractions;
            sit.weighting = parseFloat(weighting);
        }
    }
    
    function setPageScore(page_nr, score)
    {
    	var sit = state.findPage(page_nr);
        if (sit != null && (state.scoremode != 'first' || sit.count < 1))
        {
            sit.score = score;
            sit.count++;
        }
    }
    
    function findPage(page_nr)
    {
        var id = makeId(page_nr, -1, 'page', "");
        var i=0;
        for (i=0; i<this.interactions.length; i++)
        {
            if (this.interactions[i].id.indexOf(id) == 0 && this.interactions[i].id.indexOf(id + ':interaction') < 0)
                return this.interactions[i];
        }
        return null;
    }

    function findInteraction(page_nr, ia_nr)
    {
        if (ia_nr < 0)
        {
            return this.findPage(page_nr);
        }
        var id = makeId(page_nr, ia_nr, "", "");
        var i=0;
        for (i=0; i<this.interactions.length; i++)
        {
            if (this.interactions[i].id.indexOf(id) == 0)
                return this.interactions[i];
        }
        return null;
    }

    
    
    function findCreate(page_nr, ia_nr, ia_type, ia_name)
    {
        var tmpid = makeId(page_nr, ia_nr, ia_type, ia_name);
        var i=0;
        for (i=0; i<this.interactions.length; i++)
        {
            if (this.interactions[i].id == tmpid)
                return this.interactions[i];
        }
        // Not found
        var sit =  new XApiInteractionTracking(page_nr, ia_nr, ia_type, ia_name);
        if (ia_type != "page" && ia_type != "result")
        {
            this.lo_type = "interactive";
            if (this.lo_passed == -1)
            {
                this.lo_passed = 0.55;
            }
        }

        this.interactions.push(sit);
        return sit;
    }
    
    function enterPage(page_nr, ia_nr, ia_type, ia_name)
    {
        var sit = this.findCreate(page_nr, ia_nr, ia_type, ia_name);
        return sit;
    }
    
    
}

function XApiInteractionTracking(page_nr, ia_nr, ia_type, ia_name)
{
    this.id = makeId(page_nr, ia_nr, ia_type, ia_name);
	this.page_nr = page_nr;
	this.ia_nr = ia_nr;
    this.ia_type = ia_type;
    this.ia_name = ia_name;
    this.start = new Date();
    this.end = this.start;
    this.count = 0;
    this.duration = 0;
    this.nrinteractions = 0;
    this.weighting = 0.0;
    this.score = 0.0;
    
    this.exit = exit;
    
    function exit()
    {
        this.end = new Date();
        var duration = this.end.getTime() - this.start.getTime();
        if (duration > 1000)
        {
            this.duration += duration;
            this.count++;
            return true;
        }
        else
        {
            return false;
        }

    }
    
}


var state = new XApiTrackingState();

var scorm=false,
    lrsInstance,
    userEMail = "mailto:email@test.com";

var answeredQs = [];

function XTInitialise()
{
	if (! state.initialised)
    {
        state.initialised = true;
        state.initialise();
    }
	
	if(lrsInstance == undefined){
		try{
			lrsInstance = new TinCan.LRS(
				{
		            endpoint: lrsEndpoint,
		            username: lrsUsername,
		            password: lrsPassword,
		            allowFail: false,
		            version: "1.0.1"
		        }
			);
			
		}
		catch(ex)
		{
			//alert("Failed LRS setup. Error: " + ex);
		}	
	}

	if(lrsInstance != undefined)
    {
		this.initStamp = new Date();
		
        var statement = new TinCan.Statement(
            {
                actor: {
                    mbox: userEMail
                },
                verb: {
                    id: "http://adlnet.gov/expapi/verbs/launched"
                },
                target: {
                    id: "http://rusticisoftware.github.com/TinCanJS"
                    //TODO: get the name for this activity
                },
                timestamp: this.initStamp
            }
        );

        SaveStatement(statement);
    }
}

function XTTrackingSystem()
{
    return "";
}

function XTLogin(login, passwd)
{
	this.loginStamp = new Date();
	
    var statement = new TinCan.Statement(
            {
                actor: {
                    mbox: userEMail
                },
                verb: {
                    id: "http://adlnet.gov/expapi/verbs/logged-in"
                },
                target: {
                    id: "http://rusticisoftware.github.com/TinCanJS"
                },
                timestamp: this.loginStamp
            }
        );
    
    SaveStatement(statement);
    
    // TODO: Compare the login and the password with credentials from the LRS.
	
    return true;
}

function XTGetMode()
{
    return state.mode;
}

function XTStartPage()
{
    return -1;
}

function XTGetUserName()
{
    return "";
}

function XTNeedsLogin()
{
    return false;
}

function XTSetOption(option, value)
{
    switch (option)
    {
        case "nrpages":
            state.nrpages = value;
            break;
        case "toComplete":
            state.toCompletePages = value;
            //completedPages = new Array(length(toCompletePages));
            for(i = 0; i< state.toCompletePages.length;i++)
            {
                state.completedPages[i] = "false";
            }

            break;
        case "tracking-mode":
            switch(value)
            {
                case 'full_first':
                    state.trackingmode = "full";
                    state.scoremode = "first";
                    state.mode = "normal";
                    break;
                case 'minimal_first':
                	state.trackingmode = "minimal";
                	state.scoremode = "first";
                	state.mode = "normal";
                    break;
                case 'full':
                	state.trackingmode = "full";
                	state.scoremode = "last";
                	state.mode = "normal";
                    break;
                case 'minimal':
                	state.trackingmode = "minimal";
                	state.scoremode = "last";
                	state.mode = "normal";
                    break;
                case 'none':
                	state.trackingmode = "none";
                	state.mode = "no-tracking";
                    break;
            }
            break;
        case "completed":
        	state.lo_completed = value;
            break;
        case "objective_passed":
        	state.lo_passed = Number(value);
            break;
        case "page_timeout":
            // Page timeout in seconds
            state.page_timeout = Number(value) * 1000;
            break;
    }
}

function XTEnterPage(page_nr, page_name)
{
    state.enterPage(page_nr, -1, "page", page_name);
	this.pageStart = new Date();
	
    var statement = new TinCan.Statement(
            {
                actor: {
                    mbox: userEMail
                },
                verb: {
                    id: "http://adlnet.gov/expapi/verbs/initialized"
                },
                target: {
                    id: "http://rusticisoftware.github.com/TinCanJS"
                },
                timestamp: this.pageStart              	
                
            }
        );
    
    SaveStatement(statement);
}

function XTExitPage(page_nr, page_name)
{
    
	this.exitPageStamp = new Date();
	
    var statement = new TinCan.Statement(
            {
                actor: {
                    mbox: userEMail
                },
                verb: {
                    id: "http://adlnet.gov/expapi/verbs/exited"
                },
                target: {
                    id: "http://rusticisoftware.github.com/TinCanJS"
                },
                timestamp: this.exitPageStamp
            }
        );


    SaveStatement(statement);
    return state.exitInteraction(page_nr, -1, false, "", "", "", false);

}

function XTSetPageType(page_nr, page_type, nrinteractions, weighting)
{
    state.setPageType(page_nr, page_type, nrinteractions, weighting);

}

function XTSetPageScore(page_nr, score)
{
    state.setPageScore(page_nr, score);
	this.pageEnd = new Date();
	var pageDuration = this.pageEnd.getTime() - this.pageStart.getTime();
	
    var statement = new TinCan.Statement(
        {
            actor: {
                mbox: userEMail
            },
            verb: {
                id: "http://adlnet.gov/expapi/verbs/scored"
            },
            target: {
                id: "http://xerte.org.uk/xapi/questions/" + page_nr
            },
            result:{
                "completion": true,
	            "success": score >= state.lo_passed,
	            "score": {
	              "scaled": score / 100
	            },
            	"duration": pageDuration
            },
            timestamp: this.pageEnd
            
        }
    );

    SaveStatement(statement);
}

function XTEnterInteraction(page_nr, ia_nr, ia_type, ia_name, correctanswer, feedback)
{
    state.enterInteraction(page_nr, ia_nr, ia_type, ia_name, correctanswer, feedback);
    this.enterInteractionStamp = new Date();

    var statement = new TinCan.Statement(
        {
            actor: {
                mbox: userEMail
            },
            verb: {
                id: "http://adlnet.gov/expapi/verbs/attempted"
            },
            target: {
                id: "http://xerte.org.uk/xapi/questions/" + page_nr
            },
            timestamp : this.enterInteractionStamp
        }
    );

    SaveStatement(statement);
}

function XTExitInteraction(page_nr, ia_nr, ia_type, result, learneranswer, feedback)
{
    state.exitInteraction(page_nr, ia_nr, ia_type, result, learneranswer, feedback);
    if (($.inArray([page_nr, ia_nr] , answeredQs) == -1 && state.scoremode == "first") || state.scoremode == "last") {

        this.exitInteractionStamp = new Date();

        var statement = new TinCan.Statement(
            {
                actor: {
                    mbox: userEMail
                },
                verb: {
                    id: "http://adlnet.gov/expapi/verbs/answered"
                },
                target: {
                    id: "http://xerte.org.uk/xapi/questions/" + page_nr
                },
                result: {
                    "response": result + ""
                },
                timestamp : this.exitInteractionStamp
            }
        );

        answeredQs.push([page_nr, ia_nr]);
        SaveStatement(statement);
    }
}

function XTGetInteractionScore(page_nr, ia_nr, ia_type, ia_name)
{
    return 0;
}
function XTGetInteractionCorrectAnswer(page_nr, ia_nr, ia_type, ia_name)
{
    return "";
}

function XTGetInteractionCorrectAnswerFeedback(page_nr, ia_nr, ia_type, ia_name)
{
    return "";
}

function XTGetInteractionLearnerAnswer(page_nr, ia_nr, ia_type, ia_name)
{
    return "";
}

function XTGetInteractionLearnerAnswerFeedback(page_nr, ia_nr, ia_type, ia_name)
{
    return "";
}

function XTTerminate()
{
    window.opener.innerWidth+=2;
	window.opener.innerWidth-=2;
}

function SaveStatement(statement)
{
	return;
	statement.id = null;
	lrsInstance.saveStatement(
        statement,
        {
            callback: function (err, xhr) {
                if (err !== null) {
                    if (xhr !== null) {
                        //alert("Failed to save statement: " + xhr.responseText + " (" + xhr.status + ")");
                        // TODO: handle error accordingly when needed
                        return;
                    }

                    //alert("Failed to save statement: " + err);
                    // TODO: handle error accordingly when needed
                    return;
                }

            }
        }
    );
}

function XTResults()
{
    var results = {};
    results.mode = x_currentPageXML.getAttribute("mode");

    var score = 0,
    nrofquestions = 0,
    totalWeight = 0,
    totalDuration = 0;
    results.interactions = Array();

    for(i = 0; i < state.interactions.length-1; i++){
        score += state.interactions[i].score * state.interactions[i].weighting ;
        if(state.interactions[i].nrinteractions > 0)
        {
            var interaction = {};
            interaction.score = Math.round(state.interactions[i].score);
            interaction.title = state.interactions[i].ia_name;
            interaction.type = state.interactions[i].ia_type;
            interaction.duration = Math.round(state.interactions[i].duration / 1000);
            interaction.weighting = state.interactions[i].weighting;
            interaction.subinteractions = Array();
            results.interactions[nrofquestions] = interaction;
            totalDuration += state.interactions[i].duration;
            nrofquestions++;
            totalWeight += state.interactions[i].weighting;

        }else if(results.mode == "full-results")
        {
            var subinteraction = {}

            var learnerAnswer, correctAnswer;
            switch (state.interactions[i].ia_type){
                case "match":
                    if (state.interactions[i].learneroptions[0] == null)
                    {
                        learnerAnswer = "";
                    }
                    else
                    {
                        learnerAnswer = state.interactions[i].learneroptions[0].source;
                    }
                    correctAnswer = state.interactions[i].correctoptions[0].source;
                    break;
                case "text":
                    learnerAnswer = state.interactions[i].learneranswer.join(", ");
                    correctAnswer = state.interactions[i].correctanswer.join(", ");
                    break;
                case "multiplechoice":
                    learnerAnswer = state.interactions[i].learneranswer[0];
                    for(var j = 1; j < state.interactions[i].learneranswer.length; j++)
                    {
                        learnerAnswer += "\n" + state.interactions[i].learneranswer[j];
                    }
                    correctAnswer = state.interactions[i].correctanswer[0];
                    for(var j = 1; j < state.interactions[i].correctanswer.length; j++)
                    {
                        correctAnswer += "\n" + state.interactions[i].correctanswer[j];
                    }
                    break;
                case "numeric":
                    learnerAnswer = state.interactions[i].learneranswer;
                    correctAnswer = "NA";   // Not applicable
                    //TODO: We don't have a good example of an interactivity where the numeric type has a correctAnswer. Currently implemented for the survey page.
                    break;
                case "fill-in":
                    learnerAnswer = state.interactions[i].learneranswer;
                    correctAnswer = state.interactions[i].correctanswer;
                    break;
            }
            subinteraction.question = state.interactions[i].ia_name;
            subinteraction.learnerAnswer = learnerAnswer;
            subinteraction.correct = state.interactions[i].result;
            subinteraction.correctAnswer = correctAnswer;
            results.interactions[nrofquestions-1].subinteractions.push(subinteraction);
        }

    }
    if(state.interactions.length == 0)
    {
        $("#questionScores").hide()
    }
    results.score = score;
    results.nrofquestions = nrofquestions;
    results.averageScore = Math.round(score / totalWeight);
    results.totalDuration = Math.round(totalDuration / 1000);
    results.start = state.start.getDate() + "-" + (state.start.getMonth()+1) + "-" +state.start.getFullYear() + " " + state.start.getHours() + ":" + state.start.getMinutes();

    return results;
}
