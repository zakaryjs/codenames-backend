# Codenames

## Built with React, Express and Socket.IO

### View the blog post here: [Project Showcase: Codenames Clone](https://zakarysutherland.hashnode.dev/project-showcase-codenames-clone)

This project is a recreation of the popular game Codenames, built with React, Express and Socket.IO.

### About the Game

In Codenames, players are divided into two teams - Blue, and Orange. In a team, players can either be a Spymaster or an Operative. 

The goal of the game is for the Spymaster(s) to provide one-word clues that relate to the words on the game board that are in their team colour. 

There is also one black word on each board - if an operative guesses this word, the game ends and the opposing team wins.

If a team guesses all of the words of their colour, they win the game.

### Tech Stack

The project utiliises Socket.IO in order to provide connections between users, and to rooms. 

For each interaction with the client, the socket connection emits, which then interacts with the backend in order to send data between the client and the server.