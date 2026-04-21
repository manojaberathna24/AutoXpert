import nltk
from nltk.sentiment.vader import SentimentIntensityAnalyzer
import os

# Download VADER lexicon if not present
try:
    nltk.data.find('sentiment/vader_lexicon.zip')
except LookupError:
    nltk.download('vader_lexicon')

# Initialize VADER
sid = SentimentIntensityAnalyzer()

# Custom Singlish/Sinhala Sentiment Lexicon
# Scores range from -4.0 (most negative) to +4.0 (most positive)
singlish_updates = {
    # Negative
    'awl': -2.0,
    'awul': -2.0,
    'tikkwth': -2.0,
    'set ne': -2.0,
    'set na': -2.0,
    'set naha': -2.0,
    'kisima': -2.0,
    'chater': -3.0,
    'cha': -2.5,
    'weda na': -2.0,
    'wedak na': -2.0,
    'wedak ne': -2.0,
    'wadak na': -2.0,
    'wadak ne': -2.0,
    'wardi': -2.0,
    'narakai': -2.5,
    'epaa': -2.0,
    'mello': -2.0,
    'melo': -2.0,
    'jarawa': -3.0,
    'dissapointed': -2.5,
    'not good': -2.0,  
    
    # Positive
    'supiri': 3.0,
    'elakiri': 3.0,
    'maru': 2.5,
    'niyamai': 2.5,
    'patta': 3.0,
    'hodai': 2.5,
    'hodaii': 2.5,
    'ela': 2.0,
    'adinawa': 2.0,
    'gammac': 2.5,
    'super': 2.5,
    'best': 3.0,
    'wow': 2.5,
    'woow': 2.5,
}

sid.lexicon.update(singlish_updates)

def get_sentiment(text):
    """
    Analyzes the text using VADER with custom Singlish support.
    Returns: 'positive' or 'negative' based on compound score.
    """
    if not text:
        return 'positive' # Default

    text_lower = text.lower().strip()

    # Explicit phrase checks for multi-word Singlish idioms VADER might miss
    # Also catch single words that VADER might think are neutral if tokenizer fails
    negative_phrases = ["wedak ne", "wadak ne", "wedak na", "wadak na", "weda na", "not good", "tikkwth", "set ne", "set na"]
    for phrase in negative_phrases:
        if phrase in text_lower:
             print(f"DEBUG: Found negative phrase '{phrase}' in '{text}'")
             return 'negative'
        
    scores = sid.polarity_scores(text)
    compound = scores['compound']
    
    print(f"DEBUG: VADER Scores for '{text}': {scores}")
    
    if compound < 0:
        return 'negative'
    else:
        return 'positive'