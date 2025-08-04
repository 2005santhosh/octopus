import pandas as pd
from datasets import load_dataset, Dataset
from transformers import BertTokenizer, BertForSequenceClassification, Trainer, TrainingArguments
from sklearn.model_selection import train_test_split
import torch
import os


def load_data():
    data_path = os.path.join('dataset', 'Viral_Social_Media_Trends.csv')
    df = pd.read_csv(data_path)
    return df


def prepare_dataset(df):
    df['text'] = df['Hashtag'] + ' ' + df['Content_Type'] + ' ' + df['Region']
    df['label'] = df['Engagement_Level'].apply(lambda x: 2 if x == 'High' else (1 if x == 'Medium' else 0))
    train_df, test_df = train_test_split(df, test_size=0.2, random_state=42)
    train_dataset = Dataset.from_pandas(train_df[['text', 'label']])
    test_dataset = Dataset.from_pandas(test_df[['text', 'label']])
    return train_dataset, test_dataset


def create_model():
    model = BertForSequenceClassification.from_pretrained("bert-base-uncased", num_labels=3)
    return model


def fine_tune_model(model, train_dataset, test_dataset):
    training_args = TrainingArguments(
        output_dir="./results",
        evaluation_strategy="epoch",
        save_strategy="epoch",
        learning_rate=2e-5,
        per_device_train_batch_size=16,
        per_device_eval_batch_size=16,
        num_train_epochs=3,
        weight_decay=0.01,
        logging_dir="./logs",
    )
    
    tokenizer = BertTokenizer.from_pretrained("bert-base-uncased")

    def tokenize_function(examples):
        return tokenizer(examples["text"], padding="max_length", truncation=True)

    tokenized_train = train_dataset.map(tokenize_function, batched=True)
    tokenized_test = test_dataset.map(tokenize_function, batched=True)

    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=tokenized_train,
        eval_dataset=tokenized_test,
    )

    trainer.train()


if __name__ == "__main__":
    df = load_data()
    train_dataset, test_dataset = prepare_dataset(df)
    model = create_model()
    fine_tune_model(model, train_dataset, test_dataset)

