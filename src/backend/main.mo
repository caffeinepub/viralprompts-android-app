import OutCall "http-outcalls/outcall";
import List "mo:core/List";
import Iter "mo:core/Iter";
import Text "mo:core/Text";

actor {
  type ViralPrompt = {
    id : Nat;
    creator : Text;
    title : Text;
    description : Text;
    prompt : Text;
    hashtags : [Text];
    likes : Nat;
    comments : Nat;
    shares : Nat;
    creationDate : Nat;
  };

  let confirmedViralPrompts = List.empty<ViralPrompt>();
  let failedPrompts = List.empty<ViralPrompt>();
  let customPrompts = List.empty<ViralPrompt>();

  var lastKnownGoodData : ?Text = null;
  var lastFetchSuccessful = false;

  public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  public func loadConfirmedViralPrompts() : async Text {
    let requestHeaders : [OutCall.Header] = [
      {
        name = "Accept";
        value = "application/json, text/plain, */*";
      },
      {
        name = "Accept-Language";
        value = "en-US,en;q=0.9";
      },
      {
        name = "Cache-Control";
        value = "no-cache";
      },
      {
        name = "Pragma";
        value = "no-cache";
      },
      {
        name = "Connection";
        value = "keep-alive";
      },
      {
        name = "Accept-Encoding";
        value = "gzip, deflate, br";
      },
    ];

    let fetchResult = await OutCall.httpGetRequest("https://viralprompts.in/data.json", requestHeaders, transform);

    let isCloudflareError = fetchResult.contains(#text "Cloudflare");
    let is520Error = fetchResult.contains(#text "520");
    let is403Error = fetchResult.contains(#text "403");

    switch (isCloudflareError, is520Error, is403Error) {
      case (true, _, _) {
        lastFetchSuccessful := false;
        switch (lastKnownGoodData) {
          case (null) { fetchResult };
          case (?validData) { validData };
        };
      };
      case (_, true, _) {
        lastFetchSuccessful := false;
        switch (lastKnownGoodData) {
          case (null) { fetchResult };
          case (?validData) { validData };
        };
      };
      case (_, _, true) {
        lastFetchSuccessful := false;
        switch (lastKnownGoodData) {
          case (null) { fetchResult };
          case (?validData) { validData };
        };
      };
      case _ {
        lastFetchSuccessful := true;
        lastKnownGoodData := ?fetchResult;
        fetchResult; // Successful fetch, return content directly
      };
    };
  };

  func addFailedPrompt(prompt : ViralPrompt) {
    failedPrompts.add(prompt);
  };

  public query({ caller }) func getAllConfirmedViralPrompts() : async [ViralPrompt] {
    confirmedViralPrompts.toArray();
  };

  public func getRandomPrompt() : async ?ViralPrompt {
    let promptsArray = confirmedViralPrompts.toArray();
    let promptCount = promptsArray.size();
    if (promptCount == 0) { return null };
    ?promptsArray[0];
  };
};
