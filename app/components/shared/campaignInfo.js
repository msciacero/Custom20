//need to know what the campaign_id is for state management
var campaignInfo = document.createElement("input");
campaignInfo.type = "hidden";
campaignInfo.name = "c20-campaignInfo";
campaignInfo.id = "c20-campaignInfo";
campaignInfo.setAttribute("c20-campaign-id", window.campaign_id);

document.body.appendChild(campaignInfo);
