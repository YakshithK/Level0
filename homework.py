"""
Programmar: Yakshith
Date: June 11th, 2025
Version: 1.0
Description: Python program to encode secret message for Abhijot's secret communication system
"""

def reverse(string): # define function to reverse string
    new_string = ""
    for i in range(len(string)-1, -1, -1): # loop through the string backwards and add it to the new string
        new_string += string[i]

    return new_string

alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ" # initialize the list of alphabet

message = input("Enter a message to encode: ") # get input from user
encoded_message = "" # initalize the new message

curr_shift = "forward" # set the current direction to forward

for i in message: # loop through the input from user
    if i.isalpha(): # if the character is alpha,
        if curr_shift == "forward": # check if direction is forward
            curr_shift = "backward" # set to backward
            index = alphabet.index(i.upper()) + 1 # get the index and then add one to move to the next
            if index >= len(alphabet): # if index is out of range, i.e. character is z so index would be 26, move to the beginning (0)
                index = 0

        else:
            curr_shift = "forward" # else if direction is backward, set to forward
            index = alphabet.index(i.upper()) - 1 # get the index but remove one to move to the previous
            if index < 0: # if index is out of range, i.e. character is a so index would be 0, move to the end (-1)
                index = -1

        char = alphabet[index] # get the char from the list of alphabets

        if i.isupper(): # if origin character is upper, add the one from the list

# How do you deal with lowercase characters?!
# 70%

            encoded_message += char
        else:
            encoded_message += char.lower() # else, convert to lower and then add

    else:
        encoded_message += i # if the character is non-alpha, simply add it

print(reverse(encoded_message)) # display the final message by encoding it and then reversing it
# Incorrect result!
# Enter a message to encode: !fohnlbqhnsO oniszO 3-=3-1 fupK J
# I Love 1-3=-3 Python Progrzmming!
# Correct result is !fohnlbqhnsO oniszO 3-=3-1 fupK J