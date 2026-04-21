from helper import get_sentiment
import nltk
from nltk.sentiment.vader import SentimentIntensityAnalyzer

# Test cases provided by user
test_phrases = [
    "awl",
    "wedak ne",
    "not good",
    "hodai",
    "this is not good",
    "supiri",
    "awul"
]

print("--- Debugging Helper Function ---")
for text in test_phrases:
    sentiment = get_sentiment(text)
    print(f"Text: '{text}' -> Result: {sentiment}")

print("\n--- Direct VADER Debug ---")
sid = SentimentIntensityAnalyzer()
# Manually apply same updates as helper.py (copy content to verify)
singlish_updates = {
    'awul': -2.0,
    'awl': -2.0, # Adding 'awl' as user typed it
    'wedak ne': -2.0,
    'not good': -2.0,
    'hodai': 2.5,
}
sid.lexicon.update(singlish_updates)

for text in test_phrases:
    scores = sid.polarity_scores(text)
    print(f"'{text}' -> {scores}")
