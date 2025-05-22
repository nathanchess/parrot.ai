# Parrot.AI | 🏆 Won Personal Knowledge Management Track
<div align="center">
<img src=https://github.com/user-attachments/assets/f97774ea-5c09-47b2-9e0b-8178b3812f6b>

</div>

## Techstack
<div align="center">
  <img alt="Alt text" src="https://img.shields.io/badge/AWS-%23FF9900.svg?style=for-the-badge&logo=amazon-aws&logoColor=white"/>
  <img src=https://img.shields.io/badge/Amazon%20S3-FF9900?style=for-the-badge&logo=amazons3&logoColor=white>
  <img src=https://img.shields.io/badge/Tailwind%20CSS-06B6D4.svg?style=for-the-badge&logo=Tailwind-CSS&logoColor=white>
  <img src=https://img.shields.io/badge/postgres-%23316192.svg?style=for-the-badge&logo=postgresql&logoColor=white>
  <img src=https://img.shields.io/badge/Node.js-5FA04E.svg?style=for-the-badge&logo=nodedotjs&logoColor=white>
  <img src=https://img.shields.io/badge/expo-1C1E24?style=for-the-badge&logo=expo&logoColor=#D04A37>
  <img src=https://img.shields.io/badge/react_native-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB>
  <img src="https://img.shields.io/badge/Python-3776AB.svg?style=for-the-badge&logo=Python&logoColor=white" alt="Python">
  <img src="https://img.shields.io/badge/Flask-000000.svg?style=for-the-badge&logo=Flask&logoColor=white" alt="Flask">
  <img src=https://img.shields.io/badge/gunicorn-%298729.svg?style=for-the-badge&logo=gunicorn&logoColor=white>
  <img src="https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white">
</div>

## Video Demo
https://github.com/user-attachments/assets/5652bf39-cff2-43aa-9d7b-674c7f55c58a

## Inspiration
Parrot.AI was inspired by the common struggle of remembering important conversations in our busy lives. Often, crucial details slip through the cracks, leading to frustration when trying to recall a specific discussion. The need for a tool that could act as a personal assistant to capture, transcribe, and make sense of these daily interactions sparked the creation of Parrot.AI. This application aims to seamlessly record, transcribe, and analyze your conversations, acting as your mobile secretary.

## What It Does
Parrot.AI is a personal assistant application that listens discreetly to your conversations and helps you retrieve important details whenever needed by:

Recording conversations 24/7 using the mobile device’s microphone.

Storing and securely processing the audio data on AWS, converting it to text, and applying personal information redaction.

Allowing users to search through past conversations with an AI-powered chat feature to get answers and insights, improving productivity and communication in personal, academic, and professional contexts.

# How We Built It

**Frontend**: React Native with Expo for seamless mobile app development on iOS and Android. Integrated authentication using Google OAuth and Apple ID.

**Backend**: Flask API to handle audio data ingestion, with AWS S3 for storage and AWS Transcribe for speech-to-text conversion.

**Data Processing**: Text data converted to vector embeddings with Amazon Titan V2 on AWS Bedrock, stored in AWS RDS for efficient similarity search.

**AI Model Interaction**: Integrated with AWS Bedrock Nova AI model to answer user queries based on past conversations.

## Challenges We Ran Into
Throughout development, we faced several challenges:

1. Audio Data Storage: Storing and referencing large volumes of audio data was initially tricky. We overcame this by converting audio files into text and embedding that data for easier retrieval.
2. Continuous Data Streaming: Initially, we tried Kinesis for streaming data but opted for a simpler method of uploading files directly to S3 buckets for efficiency.
3. Providing Context to AI: With massive amounts of conversation data, we needed a way to efficiently filter relevant context. We solved this by using vector embeddings and integrating a similarity search on AWS RDS.

## Accomplishments That We’re Proud Of
We’re particularly proud of:

- Successfully creating an end-to-end system that can record, process, and provide insightful responses based on past conversations.
- Building a robust backend on AWS that scales efficiently, ensuring quick response times and high accuracy.
- Creating a seamless mobile user experience that integrates with existing authentication systems, making it easy for users to adopt.

## What We Learned
Through Parrot.AI's development, we learned:
1. How to leverage AWS Transcribe and AWS RDS effectively for transcription and data storage.
2. The importance of vector embeddings and similarity search for providing relevant context to AI-powered applications.
3. How to manage data privacy and secure processing while ensuring efficiency and performance.

## What’s Next
Looking ahead, we plan to:
1. Enhance cost-efficiency by optimizing AWS RDS and incorporating AWS Lambda for serverless computing, lowering the overall operating cost.
2. Improve the AI model’s context understanding and performance through better data processing and more advanced embeddings.
3. Expand the app’s capabilities to include multi-language support and personalized insights based on user preferences.
