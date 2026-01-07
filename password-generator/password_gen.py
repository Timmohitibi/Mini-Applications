import tkinter as tk
from tkinter import ttk, messagebox
import random
import string
import pyperclip

class PasswordGenerator:
    def __init__(self, root):
        self.root = root
        self.root.title("Password Generator")
        self.root.geometry("400x500")
        self.root.resizable(False, False)
        
        # Variables
        self.length_var = tk.IntVar(value=12)
        self.uppercase_var = tk.BooleanVar(value=True)
        self.lowercase_var = tk.BooleanVar(value=True)
        self.numbers_var = tk.BooleanVar(value=True)
        self.symbols_var = tk.BooleanVar(value=True)
        self.exclude_ambiguous_var = tk.BooleanVar(value=False)
        
        self.setup_ui()
    
    def setup_ui(self):
        # Title
        title_label = tk.Label(self.root, text="Password Generator", 
                              font=("Arial", 16, "bold"))
        title_label.pack(pady=10)
        
        # Length frame
        length_frame = tk.Frame(self.root)
        length_frame.pack(pady=10, padx=20, fill="x")
        
        tk.Label(length_frame, text="Password Length:").pack(anchor="w")
        length_scale = tk.Scale(length_frame, from_=4, to=50, 
                               orient="horizontal", variable=self.length_var)
        length_scale.pack(fill="x", pady=5)
        
        # Options frame
        options_frame = tk.LabelFrame(self.root, text="Character Options", 
                                     padx=10, pady=10)
        options_frame.pack(pady=10, padx=20, fill="x")
        
        tk.Checkbutton(options_frame, text="Uppercase Letters (A-Z)", 
                      variable=self.uppercase_var).pack(anchor="w")
        tk.Checkbutton(options_frame, text="Lowercase Letters (a-z)", 
                      variable=self.lowercase_var).pack(anchor="w")
        tk.Checkbutton(options_frame, text="Numbers (0-9)", 
                      variable=self.numbers_var).pack(anchor="w")
        tk.Checkbutton(options_frame, text="Symbols (!@#$%^&*)", 
                      variable=self.symbols_var).pack(anchor="w")
        tk.Checkbutton(options_frame, text="Exclude Ambiguous (0,O,l,1)", 
                      variable=self.exclude_ambiguous_var).pack(anchor="w")
        
        # Generate button
        generate_btn = tk.Button(self.root, text="Generate Password", 
                               command=self.generate_password,
                               bg="#4CAF50", fg="white", font=("Arial", 12),
                               pady=10)
        generate_btn.pack(pady=20)
        
        # Password display
        self.password_text = tk.Text(self.root, height=3, wrap="word", 
                                   font=("Courier", 12))
        self.password_text.pack(pady=10, padx=20, fill="x")
        
        # Buttons frame
        buttons_frame = tk.Frame(self.root)
        buttons_frame.pack(pady=10)
        
        copy_btn = tk.Button(buttons_frame, text="Copy to Clipboard", 
                           command=self.copy_password)
        copy_btn.pack(side="left", padx=5)
        
        clear_btn = tk.Button(buttons_frame, text="Clear", 
                            command=self.clear_password)
        clear_btn.pack(side="left", padx=5)
        
        # Strength indicator
        self.strength_label = tk.Label(self.root, text="", font=("Arial", 10))
        self.strength_label.pack(pady=5)
    
    def generate_password(self):
        # Validate options
        if not any([self.uppercase_var.get(), self.lowercase_var.get(),
                   self.numbers_var.get(), self.symbols_var.get()]):
            messagebox.showerror("Error", "Please select at least one character type!")
            return
        
        # Build character set
        chars = ""
        if self.uppercase_var.get():
            chars += string.ascii_uppercase
        if self.lowercase_var.get():
            chars += string.ascii_lowercase
        if self.numbers_var.get():
            chars += string.digits
        if self.symbols_var.get():
            chars += "!@#$%^&*()_+-=[]{}|;:,.<>?"
        
        # Remove ambiguous characters if requested
        if self.exclude_ambiguous_var.get():
            ambiguous = "0O1lI"
            chars = ''.join(c for c in chars if c not in ambiguous)
        
        # Generate password
        length = self.length_var.get()
        password = ''.join(random.choice(chars) for _ in range(length))
        
        # Display password
        self.password_text.delete(1.0, tk.END)
        self.password_text.insert(1.0, password)
        
        # Show strength
        strength = self.calculate_strength(password)
        self.strength_label.config(text=f"Strength: {strength}", 
                                 fg=self.get_strength_color(strength))
    
    def calculate_strength(self, password):
        score = 0
        
        # Length bonus
        if len(password) >= 8:
            score += 1
        if len(password) >= 12:
            score += 1
        
        # Character variety
        if any(c.isupper() for c in password):
            score += 1
        if any(c.islower() for c in password):
            score += 1
        if any(c.isdigit() for c in password):
            score += 1
        if any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in password):
            score += 1
        
        if score <= 2:
            return "Weak"
        elif score <= 4:
            return "Medium"
        else:
            return "Strong"
    
    def get_strength_color(self, strength):
        colors = {"Weak": "red", "Medium": "orange", "Strong": "green"}
        return colors.get(strength, "black")
    
    def copy_password(self):
        password = self.password_text.get(1.0, tk.END).strip()
        if password:
            try:
                pyperclip.copy(password)
                messagebox.showinfo("Success", "Password copied to clipboard!")
            except:
                messagebox.showwarning("Warning", "Could not copy to clipboard")
        else:
            messagebox.showwarning("Warning", "No password to copy!")
    
    def clear_password(self):
        self.password_text.delete(1.0, tk.END)
        self.strength_label.config(text="")

def main():
    root = tk.Tk()
    app = PasswordGenerator(root)
    root.mainloop()

if __name__ == "__main__":
    main()