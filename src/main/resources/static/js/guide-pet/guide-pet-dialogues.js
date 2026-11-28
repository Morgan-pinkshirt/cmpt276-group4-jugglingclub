function dialogue(text, expression, options = {}) {

    return {
        text,
        expression,
        ...options
    };
}


export const GUIDE_PET_DIALOGUES = {

    // Random conversations and expressions
    talk: [

        // Happiness and excitement

        dialogue(
            "Hello there! Ready to create something fun?",
            "happy-excited"
        ),

        dialogue(
            "Imagine all the things we could create together!",
            "star-eyes"
        ),

        dialogue(
            "I really like spending time with you!",
            "heart-eyes"
        ),

        dialogue(
            "What a lovely day to be creative!",
            "emotion-flowers"
        ),

        dialogue(
            "A little love for your hard work!",
            "love"
        ),

        dialogue(
            "Peace! Let's make something amazing!",
            "double-peace-sign"
        ),


        // Playful expressions

        dialogue(
            "Hehe... what are you working on?",
            "mischievous"
        ),

        dialogue(
            "Bleh! Just kidding!",
            "tongue-out"
        ),

        dialogue(
            "Hmm... what should we create next?",
            "question-mark"
        ),

        dialogue(
            "So many colors! My head is spinning!",
            "dizzy"
        ),

        dialogue(
            "Wait... what was I going to say?",
            "blank-eyes"
        ),

        dialogue(
            "Hey! Don't forget to save your work!",
            "angry"
        ),

        dialogue(
            "Maybe I should take a little nap...",
            "closed-eyes-drooling"
        ),

        dialogue(
            "Surprise! Were you expecting that?",
            "exclamation-mark"
        ),


        // Shyness and nervousness

        dialogue(
            "Oh! You wanted to talk to me?",
            "blushing"
        ),

        dialogue(
            "Phew... creating things can be hard work!",
            "sweating"
        ),

        dialogue(
            "I'm so excited to see what you make!",
            "heartbeat"
        ),


        // Glasses

        dialogue(
            "How do I look with these glasses?",
            "round-glasses"
        ),

        dialogue(
            "I think these suit me pretty well!",
            "oval-glasses"
        ),

        dialogue(
            "Time to look a little more professional!",
            "square-glasses"
        ),

        dialogue(
            "Too cool for ordinary juggling!",
            "sunglasses"
        ),


        // Accessories and stickers

        dialogue(
            "Look! I found a cute little bow!",
            "bow-sticker"
        ),

        dialogue(
            "Hop, hop! Do you like my bunny sticker?",
            "bunny-sticker"
        ),

        dialogue(
            "Meow! I have a new little friend!",
            "cat-sticker"
        ),

        dialogue(
            "Meow~ Meow~",
            "cat-paw-animation"
        ),

        dialogue(
            "I'm ready for some serious work!",
            "headband"
        ),

        dialogue(
            "A new hairstyle for a new day!",
            "side-ponytail"
        ),


        // Food and drinks

        dialogue(
            "A little dessert break sounds nice!",
            "parfait"
        ),

        dialogue(
            "Have you had something to eat today?",
            "omelette-rice"
        ),

        dialogue(
            "Time for a little energy boost!",
            "monster-energy"
        ),

        dialogue(
            "Even my drink can change colors!",
            "monster-energy-color-change"
        ),

        dialogue(
            "Anyone want to order something?",
            "order-button-pressed"
        ),

        dialogue(
            "Let's decorate it with something fun!",
            "squeeze"
        ),


        // Creative tools

        dialogue(
            "Every great design starts with an idea!",
            "paintbrush"
        ),

        dialogue(
            "Making mistakes is part of creating!",
            "eraser"
        ),

        dialogue(
            "A different color can change everything!",
            "phone-color-change"
        ),

        dialogue(
            "Let's give my workspace a new look!",
            "dark-tablecloth"
        ),


        // Special props

        dialogue(
            "Look what I found! A little whale!",
            "whale"
        ),

        dialogue(
            "My little whale wanted to visit too!",
            "whale-on-table"
        ),

        dialogue(
            "And now for my little disappearing trick!",
            "retract"
        )
    ],


    // General interaction dialogues
    general: {

        hide: [

            dialogue(
                "I'll stay right here!",
                "happy-excited"
            ),

            dialogue(
                "Just call me if you need me!",
                "mischievous"
            ),

            dialogue(
                "I'll give you some space to work.",
                "emotion-flowers"
            ),

            dialogue(
                "See you in a little while!",
                "double-peace-sign"
            )
        ],

        restore: [

            dialogue(
                "I'm back!",
                "heart-eyes"
            ),

            dialogue(
                "Did you miss me?",
                "happy-excited"
            ),

            dialogue(
                "Need my help again?",
                "question-mark"
            ),

            dialogue(
                "Ready for more fun!",
                "star-eyes"
            ),

            dialogue(
                "Hehe, you found me!",
                "mischievous"
            ),

            dialogue(
                "Hello again!",
                "cat-paw-animation"
            )
        ]
    },


    // Size change reactions
    resize: {

        larger: [

            dialogue(
                "Wow! I'm getting bigger!",
                "star-eyes"
            ),

            dialogue(
                "Look how big I am now!",
                "star-eyes"
            ),

            dialogue(
                "I feel enormous!",
                "star-eyes"
            ),

            dialogue(
                "More room for me!",
                "star-eyes"
            ),

            dialogue(
                "Yay! I can see everything better!",
                "star-eyes"
            )
        ],

        smaller: [

            dialogue(
                "Aww... I'm shrinking!",
                "crying"
            ),

            dialogue(
                "I'm so tiny now...",
                "crying"
            ),

            dialogue(
                "Wait! Where did all my size go?",
                "crying"
            ),

            dialogue(
                "I'm becoming pocket-sized!",
                "crying"
            ),

            dialogue(
                "So small...",
                "crying"
            )
        ]
    },


    // First-time user onboarding
    onboarding: {

        welcome: dialogue(

            "Welcome to The Jesters Club! " +
            "I'm your little assistant. " +
            "I can help you explore the website, " +
            "find your projects, and get started with the editors. " +
            "Would you like some tips?",

            "happy-excited",

            {
                persistent: true
            }
        ),

        accepted: dialogue(

            "Wonderful! Let me show you around!",

            "star-eyes"
        ),

        skipped: dialogue(

            "No problem! Just click on me " +
            "whenever you need a little help.",

            "happy-excited"
        ),

        completed: dialogue(

            "That's everything for now! " +
            "Have fun creating, and remember that I'm always nearby.",

            "heart-eyes"
        ),

        tutorials: dialogue(

            "I've prepared some video tutorials for you. " +
            "Let's take a look!",

            "star-eyes"
        ),

        tips: [

            dialogue(

                "You can use the 3D Editor and 2D Editor " +
                "to create your own juggling props.",

                "happy-excited"
            ),

            dialogue(

                "Try experimenting with different colors, " +
                "lighting effects, and patterns.",

                "paintbrush"
            ),

            dialogue(

                "Synchro lets you combine your designs with music. " +
                "Each moment can have its own configuration.",

                "star-eyes"
            ),

            dialogue(

                "Remember to save your creations. " +
                "You can find them again in Saved Projects.",

                "exclamation-mark"
            ),

            dialogue(

                "You can import and export your saved projects " +
                "to keep a local copy of your creations.",

                "round-glasses"
            ),

            dialogue(

                "Visit Account Settings to customize your theme " +
                "and manage your account.",

                "emotion-flowers"
            ),

            dialogue(

                "You can drag me around, change my size, " +
                "or hide me at either side of your screen.",

                "mischievous"
            ),

            dialogue(

                "Need more detailed instructions? " +
                "You can always visit the Video Tutorials page.",

                "square-glasses"
            )
        ]
    },


    // Role and page-specific dialogues
    pages: {

        GUEST: {

            home: {

                welcome: [

                    dialogue(
                        "Welcome to The Jesters Club!",
                        "happy-excited"
                    ),

                    dialogue(
                        "Hello! Welcome to our club!",
                        "emotion-flowers"
                    ),

                    dialogue(
                        "Come and explore the world of creative juggling!",
                        "star-eyes"
                    )
                ],

                click: [

                    dialogue(
                        "Create your own juggling props and performances!",
                        "star-eyes"
                    ),

                    dialogue(
                        "Why not join us and start creating?",
                        "heart-eyes"
                    ),

                    dialogue(
                        "New here? Create an account to get started!",
                        "happy-excited"
                    ),

                    dialogue(
                        "I'd love to show you what our club can do!",
                        "cat-paw-animation"
                    )
                ],

                tips: [

                    dialogue(
                        "Register to access our editors and save your own projects.",
                        "question-mark"
                    ),

                    dialogue(
                        "Already a member? Log in to continue creating.",
                        "happy-excited"
                    ),

                    dialogue(
                        "You can create your own colors, effects, and performances!",
                        "paintbrush"
                    )
                ]
            }
        },


        MEMBER: {

            // Member Home
            home: {

                welcome: [

                    dialogue(
                        "Welcome back, Jester!",
                        "happy-excited"
                    ),

                    dialogue(
                        "Ready for another creative adventure?",
                        "star-eyes"
                    ),

                    dialogue(
                        "What would you like to create today?",
                        "emotion-flowers"
                    ),

                    dialogue(
                        "It's good to see you again!",
                        "heart-eyes"
                    )
                ],

                click: [

                    dialogue(
                        "Where would you like to go?",
                        "question-mark"
                    ),

                    dialogue(
                        "Let's get creative!",
                        "happy-excited"
                    ),

                    dialogue(
                        "Have you tried making something new today?",
                        "star-eyes"
                    )
                ],

                tips: [

                    dialogue(
                        "Use the 3D or 2D Editor to design your juggling props.",
                        "question-mark"
                    ),

                    dialogue(
                        "Synchro lets you synchronize your designs with music.",
                        "star-eyes"
                    ),

                    dialogue(
                        "You can find your previous creations in Saved Projects.",
                        "happy-excited"
                    )
                ]
            },


            // 3D Editor
            editor3d: {

                welcome: [

                    dialogue(
                        "Welcome to the 3D Editor!",
                        "happy-excited"
                    ),

                    dialogue(
                        "Let's design something amazing!",
                        "star-eyes"
                    )
                ],

                click: [

                    dialogue(
                        "Need help designing your juggling props?",
                        "question-mark"
                    ),

                    dialogue(
                        "Let's try some new colors!",
                        "paintbrush"
                    ),

                    dialogue(
                        "That looks like an interesting design!",
                        "round-glasses"
                    )
                ],

                tips: [

                    dialogue(
                        "Experiment with different colors and lighting effects.",
                        "emotion-flowers"
                    ),

                    dialogue(
                        "Try rotating the model to inspect your design.",
                        "happy-excited"
                    ),

                    dialogue(
                        "Remember to save your creation before leaving!",
                        "exclamation-mark"
                    ),

                    dialogue(
                        "Want to synchronize your design with music? Try Synchro!",
                        "star-eyes"
                    )
                ]
            },


            // 2D Editor
            editor2d: {

                welcome: [

                    dialogue(
                        "Welcome to the 2D Editor!",
                        "happy-excited"
                    )
                ],

                click: [

                    dialogue(
                        "How is your design coming along?",
                        "mischievous"
                    ),

                    dialogue(
                        "A little color can make a big difference!",
                        "paintbrush"
                    ),

                    dialogue(
                        "I'm curious to see the finished design!",
                        "oval-glasses"
                    )
                ],

                tips: [

                    dialogue(
                        "Try different colors and effect patterns.",
                        "star-eyes"
                    ),

                    dialogue(
                        "Switch to the 3D Editor for another view of your design.",
                        "question-mark"
                    ),

                    dialogue(
                        "Don't forget to save your changes.",
                        "exclamation-mark"
                    )
                ]
            },


            // Saved Product Editor
            savedProductEditor: {

                welcome: [

                    dialogue(
                        "Let's continue working on your creation!",
                        "happy-excited"
                    )
                ],

                click: [

                    dialogue(
                        "What would you like to change?",
                        "question-mark"
                    ),

                    dialogue(
                        "There's always room for another creative idea!",
                        "paintbrush"
                    )
                ],

                tips: [

                    dialogue(
                        "You can continue customizing your saved design.",
                        "emotion-flowers"
                    ),

                    dialogue(
                        "Remember to save any new changes.",
                        "exclamation-mark"
                    )
                ]
            },


            // Synchro
            synchro: {

                welcome: [

                    dialogue(
                        "Welcome to Synchro!",
                        "happy-excited"
                    ),

                    dialogue(
                        "Let's bring your performance to life!",
                        "star-eyes"
                    )
                ],

                click: [

                    dialogue(
                        "Need help synchronizing your performance?",
                        "question-mark"
                    ),

                    dialogue(
                        "I wonder what music we'll use today!",
                        "heartbeat"
                    ),

                    dialogue(
                        "Lights, music, and action!",
                        "sunglasses"
                    )
                ],

                tips: [

                    dialogue(
                        "Start by importing your music.",
                        "happy-excited"
                    ),

                    dialogue(
                        "Use the timeline to organize your moments.",
                        "question-mark"
                    ),

                    dialogue(
                        "Customize each moment with its own design.",
                        "emotion-flowers"
                    ),

                    dialogue(
                        "Save your Synchro project to continue working on it later.",
                        "exclamation-mark"
                    )
                ]
            },


            // Moment Editor
            momentEditor: {

                welcome: [

                    dialogue(
                        "Let's customize this moment!",
                        "happy-excited"
                    )
                ],

                click: [

                    dialogue(
                        "Need help editing this moment?",
                        "question-mark"
                    ),

                    dialogue(
                        "Let's give this moment its own personality!",
                        "star-eyes"
                    ),

                    dialogue(
                        "How is your design coming along?",
                        "mischievous"
                    ),

                    dialogue(
                        "What colors would match this moment best?",
                        "paintbrush"
                    )
                ],

                tips: [

                    dialogue(
                        "Customize the 3D design for the selected moment.",
                        "question-mark"
                    ),

                    dialogue(
                        "Try different colors and lighting effects to match your music.",
                        "emotion-flowers"
                    ),

                    dialogue(
                        "Each moment can have its own design configuration.",
                        "star-eyes"
                    ),

                    dialogue(
                        "Remember to save the moment design before returning to Synchro.",
                        "exclamation-mark"
                    )
                ]
            },


            // Saved Projects
            savedProjects: {

                welcome: [

                    dialogue(
                        "Here are all your creations!",
                        "star-eyes"
                    ),

                    dialogue(
                        "Ready to revisit an old project?",
                        "happy-excited"
                    )
                ],

                click: [

                    dialogue(
                        "Which project would you like to work on?",
                        "question-mark"
                    ),

                    dialogue(
                        "Look at everything you've created!",
                        "heart-eyes"
                    )
                ],

                tips: [

                    dialogue(
                        "You can reopen your saved Products and Synchro Projects.",
                        "happy-excited"
                    ),

                    dialogue(
                        "Use Export to download a copy of your project.",
                        "question-mark"
                    ),

                    dialogue(
                        "Use Import to load a project from a local file.",
                        "emotion-flowers"
                    ),

                    dialogue(
                        "Be careful when deleting projects!",
                        "exclamation-mark"
                    )
                ]
            },


            // Account Settings
            settings: {

                welcome: [

                    dialogue(
                        "Make your account feel more like you!",
                        "happy-excited"
                    )
                ],

                click: [

                    dialogue(
                        "Looking for a particular setting?",
                        "question-mark"
                    ),

                    dialogue(
                        "Which theme do you like best?",
                        "star-eyes"
                    ),

                    dialogue(
                        "A little customization makes everything better!",
                        "bow-sticker"
                    )
                ],

                tips: [

                    dialogue(
                        "You can customize your preferred website theme.",
                        "emotion-flowers"
                    ),

                    dialogue(
                        "Link an email address to help recover your account.",
                        "question-mark"
                    ),

                    dialogue(
                        "Keep your password and security questions safe.",
                        "exclamation-mark"
                    )
                ]
            },


            // Video Tutorials
            tutorials: {

                welcome: [

                    dialogue(
                        "Welcome! Let's learn something new!",
                        "happy-excited"
                    ),

                    dialogue(
                        "Ready for a little lesson?",
                        "round-glasses"
                    )
                ],

                click: [

                    dialogue(
                        "Which tutorial would you like to watch?",
                        "question-mark"
                    ),

                    dialogue(
                        "Learning new things is exciting!",
                        "star-eyes"
                    )
                ],

                tips: [

                    dialogue(
                        "Start with the Getting Started tutorial if you're new here.",
                        "happy-excited"
                    ),

                    dialogue(
                        "Choose a tutorial based on the editor you want to use.",
                        "square-glasses"
                    ),

                    dialogue(
                        "You can keep a tutorial open while working in another tab.",
                        "emotion-flowers"
                    )
                ]
            }
        }
    }
};


// Expressions excluded from all random behavior
export const EXCLUDED_RANDOM_EXPRESSIONS = Object.freeze([

    "crying",
    "sad",
    "gloomy",
    "soul-leaving"
]);


// Expressions suitable for frequent idle behavior
export const COMMON_EXPRESSIONS = Object.freeze([

    "happy-excited",
    "star-eyes",
    "heart-eyes",
    "emotion-flowers",
    "love",
    "mischievous",
    "tongue-out",
    "question-mark",
    "blushing",
    "heartbeat",
    "exclamation-mark",
    "closed-eyes-drooling"
]);


// Derive the complete random expression pool
// from the central Talk dialogue collection
export const RANDOM_EXPRESSIONS = Object.freeze(

    [...new Set(

        GUIDE_PET_DIALOGUES.talk.map(
            item => item.expression
        )

    )].filter(

        expression =>

            typeof expression === "string" &&

            !EXCLUDED_RANDOM_EXPRESSIONS.includes(
                expression
            )
    )
);


// Expressions suitable for less frequent idle behavior
export const RARE_EXPRESSIONS = Object.freeze(

    RANDOM_EXPRESSIONS.filter(

        expression =>

            !COMMON_EXPRESSIONS.includes(expression)
    )
);


// Remove unavailable model expressions
export function filterAvailableExpressions(
    expressions,
    availableExpressions = null
) {

    const pool = expressions.filter(

        expression =>

            !EXCLUDED_RANDOM_EXPRESSIONS.includes(
                expression
            )
    );

    if (!Array.isArray(availableExpressions)) {

        return pool;
    }

    return pool.filter(

        expression =>

            availableExpressions.includes(expression)
    );
}


// Return a random item while avoiding immediate repetition
export function selectDialogue(
    items,
    options = {}
) {

    if (!Array.isArray(items) || items.length === 0) {

        return null;
    }

    const {

        previousText = null,

        previousExpression = null,

        availableExpressions = null

    } = options;


    let pool = items.filter(

        item =>

            item &&
            typeof item.text === "string"
    );


    if (Array.isArray(availableExpressions)) {

        pool = pool.filter(

            item =>

                !item.expression ||

                availableExpressions.includes(
                    item.expression
                )
        );
    }


    if (pool.length === 0) {

        return null;
    }


    // Prefer a different dialogue and expression
    const different = pool.filter(

        item =>

            item.text !== previousText &&

            item.expression !== previousExpression
    );


    if (different.length > 0) {

        pool = different;

    } else {

        // At least avoid repeating the same dialogue
        const differentText = pool.filter(

            item =>

                item.text !== previousText
        );

        if (differentText.length > 0) {

            pool = differentText;
        }
    }


    const index = Math.floor(

        Math.random() * pool.length
    );

    return {
        ...pool[index]
    };
}


// Return the dialogues for a role and page
export function getPageDialogues(
    role,
    page
) {

    return GUIDE_PET_DIALOGUES.pages[role]?.[page]
        || null;
}


// Get a random Talk dialogue
export function getTalkDialogue(
    role,
    page,
    options = {}
) {

    const pageDialogues = getPageDialogues(
        role,
        page
    );

    if (!pageDialogues) {

        return null;
    }

    // Combine general conversations with page-specific dialogues
    const combined = [

        ...GUIDE_PET_DIALOGUES.talk,

        ...(pageDialogues.click || [])
    ];

    const pool = combined.filter(

        item =>

            !EXCLUDED_RANDOM_EXPRESSIONS.includes(
                item.expression
            )
    );

    return selectDialogue(
        pool,
        options
    );
}


// Get a dialogue for the requested interaction
export function getInteractionDialogue(
    role,
    page,
    type,
    options = {}
) {

    const pageDialogues = getPageDialogues(
        role,
        page
    );

    if (!pageDialogues) {

        return null;
    }

    if (type === "click" || type === "talk") {

        return getTalkDialogue(
            role,
            page,
            options
        );
    }

    const pool =

        pageDialogues[type] ||

        GUIDE_PET_DIALOGUES.general[type] ||

        [];

    return selectDialogue(
        pool,
        options
    );
}


// Get the reaction for a size change
export function getResizeDialogue(
    previousSize,
    nextSize,
    options = {}
) {

    if (

        !Number.isFinite(previousSize) ||

        !Number.isFinite(nextSize) ||

        previousSize === nextSize
    ) {

        return null;
    }

    const direction =

        nextSize > previousSize
            ? "larger"
            : "smaller";

    return selectDialogue(

        GUIDE_PET_DIALOGUES.resize[direction],

        options
    );
}


// Get a first-time onboarding dialogue
export function getOnboardingDialogue(type) {

    if (type === "tips") {

        return null;
    }

    const item =
        GUIDE_PET_DIALOGUES.onboarding[type];

    if (!item || Array.isArray(item)) {

        return null;
    }

    return {
        ...item
    };
}


// Return the number of onboarding tips
export function getOnboardingTipCount() {

    return GUIDE_PET_DIALOGUES.onboarding.tips.length;
}


// Return a specific onboarding tip in sequence
export function getOnboardingTip(index) {

    if (!Number.isInteger(index) || index < 0) {

        return null;
    }

    const item =
        GUIDE_PET_DIALOGUES.onboarding.tips[index];

    return item

        ? { ...item }

        : null;
}
