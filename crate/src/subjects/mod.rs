//! Subject core — defines identity and its existential state

pub struct Me {
    pub id: String,
    pub state: SubjectState,
}

#[derive(Default)]
pub struct SubjectState {
    pub alive: bool,
    pub conscious: bool,
    pub position: Option<String>,
}

impl Me {
    pub fn new(id: &str) -> Self {
        Self {
            id: id.to_string(),
            state: SubjectState::default(),
        }
    }

    pub fn be(&mut self, attribute: &str) {
        println!("me.be({})", attribute);
    }

    pub fn do_(&mut self, action: &str) {
        println!("me.do({})", action);
    }

    pub fn have(&mut self, thing: &str) {
        println!("me.have({})", thing);
    }
}