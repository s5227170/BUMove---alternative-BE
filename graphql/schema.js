const { buildSchema } = require("graphql");

module.exports = buildSchema(`
    type RentType {
        _id: ID!
        author: UserType!
        title: String!
        type: String!
        information: String!
        location: LocationType!
        status: String!
        price: Float!
        images: [String]!
        imgnames: [String]!
        rooms: [RoomType]!
        convos: [MessageType]!
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
        convos: [MessageInput]
    }

    type MessageType {
        _id: ID!
        home: UserType
        away: String!
        name: String!
        rentId: RentType!
        texts: [TextsType]!
    }

    input MessageInput {
        home: String!
        away: String!
        name: String!
    }
    
    type TextsType {
        _id: ID!
        author: UserType!
        content: String!
        convoId: MessageType!
        name: String!
        createdAt: String!
        updatedAt: String!
    }

    input TextsInput {
        content: String!
        name: String!
    }

    type UserType {
        _id: ID!
        name: String!
        email: String!
        avatar: String!
        admin: Boolean!
        rents: [RentType]!
        password: String!
        createdAt: String!
        updatedAt: String!
    }

    input UserInput {
        name: String
        email: String!
        password: String!
    }

    type RoomType {
        size: String!
        type: String!
    }

    input RoomInput {
        size: String!
        type: String!
    }

    type LocationType {
        lat: Float!
        lng: Float!
    }
    
    input LocationInput {
        lat: Float!
        lng: Float!
    }

    type TokenData {
        token: String!
        user: UserType!
    }

    type RootQuery {
        signIn(email: String!, password: String!): TokenData!
        rent(id: String): RentType!
        rents: [RentType]!
        user(id: String!): UserType!
    }

    type RootMutation {
        signUp(userData: UserInput): UserType!
        createRent(rent: RentInput!): RentType!
        updateRent(id: String!, rent: RentInput!): String!
        deleteRent(id: String!): String!
        updateUser(id: String!, name: String, email: String, avatar: String): UserType!
    }

    schema {
        query: RootQuery
        mutation: RootMutation
    }
`);
