const { gql } = require("apollo-server-express");

const typeDefs = gql`
  type Rent {
    _id: ID!
    author: User!
    title: String!
    type: String!
    information: String!
    location: Location!
    status: String!
    price: Float!
    images: [String]!
    imgnames: [String]!
    rooms: [Room]!
    convos: [Conversation]!
    createdAt: String!
    updatedAt: String!
  }

  input RentInput {
    title: String!
    type: String!
    information: String!
    location: LocationInput!
    status: String!
    price: Float!
    images: [String]!
    imgnames: [String]!
    rooms: [RoomInput]!
    convos: [ConversationInput]
  }

  type Conversation {
    _id: ID!
    name: String!
    rentId: Rent!
    home: String!
    away: String!
    texts: [Texts]!
  }

  input ConversationInput {
    rentId: String!
    away: String!
  }

  type Texts {
    _id: ID!
    author: User!
    receiver: String!
    content: String!
    conversation: Conversation!
    createdAt: String!
    updatedAt: String!
  }

  input TextsInput {
    content: String!
    receiver: String!
    conversation: String!
  }

  type User {
    _id: ID!
    name: String!
    email: String!
    avatar: String
    admin: Boolean!
    rents: [Rent]!
    password: String!
    createdAt: String!
    updatedAt: String!
  }

  type Room {
    size: String!
    type: String!
  }

  input RoomInput {
    size: String!
    type: String!
  }

  type Location {
    lat: Float!
    lng: Float!
  }

  input LocationInput {
    lat: Float!
    lng: Float!
  }

  type AuthData {
    userId: String!
    tokens: Tokens!
  }

  type Tokens {
    accessToken: String!
    refreshToken: String!
  }

  type AllRents {
    rents: [Rent]!
  }

  type AllTexts {
    texts: [Texts]!
  }

  input UserSignUpData {
    name: String!
    email: String!
    password: String!
  }

  type Query {
    signIn(email: String!, password: String!): Boolean!
    user: User

    rent(id: String!): Rent!
    rents: AllRents!

    conversations: Conversation!
    conversation(id: String!): Conversation!
    conversationByRent(rentId: String!): Conversation

    loadTexts(conversation: String!): AllTexts!
  }

  type Mutation {
    signUp(data: UserSignUpData!): User!
    updateUser(id: String!, name: String, email: String, avatar: String): User!

    createRent(rent: RentInput): Rent!
    updateRent(rent: RentInput, id: String!): Rent!
    deleteRent(id: String!): Boolean!

    createConversation(conversation: ConversationInput!): Conversation!
    updateConversation(id: String!, texts: [String]!): Conversation!
    deleteConversation(id: String!): Boolean!

    sendText(text: TextsInput): Texts!
  }
`;

module.exports = typeDefs;

// const { buildSchema } = require("graphql");

// module.exports = buildSchema(`
//     type RentType {
//         _id: ID!
//         author: UserType!
//         title: String!
//         type: String!
//         information: String!
//         location: LocationType!
//         status: String!
//         price: Float!
//         images: [String]!
//         imgnames: [String]!
//         rooms: [RoomType]!
//         convos: [ConversationType]!
//         createdAt: String!
//         updatedAt: String!
//     }

//     input RentInput {
//         title: String!
//         type: String!
//         information: String!
//         location: LocationInput!
//         status: String!
//         price: Float!
//         images: [String]!
//         imgnames: [String]!
//         rooms: [RoomInput]!
//         convos: [ConversationInput]
//     }

//     type ConversationType {
//         _id: ID!
//         name: String!
//         rentId: RentType!
//         home: String!
//         away: String!
//         texts: [TextsType]!
//     }

//     input ConversationInput {
//         rentId: String!
//         away: String!
//     }

// type TextsType {
//     _id: ID!
//     author: UserType!
//     receiver: String!
//     content: String!
//     conversation: ConversationType!
//     createdAt: String!
//     updatedAt: String!
// }

//     input TextsInput {
//         content: String!
//         receiver: String!
//         conversation: String!
//     }

//     type UserType {
//         _id: ID!
//         name: String!
//         email: String!
//         avatar: String!
//         admin: Boolean!
//         rents: [RentType]
//         password: String!
//         createdAt: String!
//         updatedAt: String!
//     }

//     input UserInput {
//         name: String
//         email: String!
//         password: String!
//     }

//     type RoomType {
//         size: String!
//         type: String!
//     }

//     input RoomInput {
//         size: String!
//         type: String!
//     }

//     type LocationType {
//         lat: Float!
//         lng: Float!
//     }

//     input LocationInput {
//         lat: Float!
//         lng: Float!
//     }

//     type RootQuery {
//         signIn(email: String!, password: String!): UserType
//         user: UserType

//         rent(id: String!): RentType!
//         rents: [RentType]!

//         conversations: [ConversationType]!
//         conversation(id: String!): ConversationType!
//         conversationByRent(rentId: String!): ConversationType!
//     }

//     type RootMutation {
//         signUp(userData: UserInput): UserType
//         updateUser(id: String!, name: String, email: String, avatar: String): UserType!

//         createRent(rent: RentInput!): RentType!
//         updateRent(rent: RentInput! id: String!): RentType!
//         deleteRent(id: String!): Boolean!

//         createConversation(conversation: ConversationInput!): ConversationType!
//         updateConversation(id: String! texts: [String]!): ConversationType!
//         deleteConversation(id: String!): Boolean!
//     }

//     schema {
//         query: RootQuery
//         mutation: RootMutation
//     }
// `);
