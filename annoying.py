from pynput.keyboard import Controller
import time

def type_string(string):
    keyboard = Controller()
    time.sleep(2)  # Give yourself 2 seconds to focus the desired window

    for char in string:
        keyboard.type(char)  # Type the character
        time.sleep(0.05)  # Slight delay between keystrokes (adjust if needed)

if __name__ == "__main__":
    # Replace this with your actual key
    your_long_key = "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"  # Example GitHub token
    print("Focus the input field where the key should be typed.")
    type_string(your_long_key)
    print("Key has been typed!")
