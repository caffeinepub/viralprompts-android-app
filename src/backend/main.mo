import OutCall "http-outcalls/outcall";
import List "mo:core/List";
import Iter "mo:core/Iter";

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

  var confirmedViralPrompts = List.empty<ViralPrompt>();
  var failedPrompts = List.empty<ViralPrompt>();
  var customPrompts = List.empty<ViralPrompt>();

  public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  // Load viral prompts from the source website.
  public func loadConfirmedViralPrompts() : async Text {
    await OutCall.httpGetRequest("https://viralprompts.in/data.json", [], transform);
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
    // TODO: Implement random number generator once supported
    // Has to return the first entry for now as a placeholder due to
    // current lack of random number generation support in Motoko
    ?promptsArray[0];
  };
};
